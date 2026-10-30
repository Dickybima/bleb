import { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import {
  decodeFunctionData,
  erc20Abi,
  getAbiItem,
  parseEventLogs,
  toFunctionSelector,
  type Address,
  type Hash,
  type Hex,
  type PublicClient,
  type Transport,
} from "viem";
import { robinhoodChain } from "./chains";
import {
  LAUNCHPAD_SALT_TAG,
  PONS_FACTORY,
  PONS_FACTORY_DEPLOY_BLOCK,
  isLaunchpadSalt,
  ponsFactoryAbi,
  type Socials,
} from "./pons";
import { mapLimit } from "./util";

export type LaunchedToken = {
  token: Address;
  curve: Address;
  deployer: Address;
  txHash: Hash;
  blockNumber: bigint;
  timestamp?: number;
  name: string;
  symbol: string;
  logo?: string;
  description?: string;
  socials?: Socials;
};

type Client = PublicClient<Transport, typeof robinhoodChain>;

const PAGE_SIZE = 12;
const INITIAL_CHUNK = 50_000n;
const MIN_CHUNK = 500n;
const MAX_CHUNK = 500_000n;
/** Time spent scanning per page; an empty range keeps scanning until this runs out instead of stopping early. */
const PAGE_BUDGET_MS = 12_000;
/** Block range the RPC last accepted, reused so later pages don't rediscover the limit. */
let workingChunk = INITIAL_CHUNK;

const tokenLaunchedEvent = getAbiItem({ abi: ponsFactoryAbi, name: "TokenLaunched" });

type TokenParams = {
  name: string;
  symbol: string;
  logo: string;
  description: string;
  socials: Socials;
  salt: Hex;
};

const LAUNCH_SELECTORS = ponsFactoryAbi
  .filter((item) => item.type === "function" && item.name === "launchToken")
  .map((item) => toFunctionSelector(item).slice(2).toLowerCase());
const SALT_TAG_HEX = LAUNCHPAD_SALT_TAG.slice(2).toLowerCase();

/**
 * Recovers the launch params from the transaction calldata. Direct calls decode as is; calls wrapped by a smart
 * wallet, multicall or batch (EIP-7702, Safe, Coinbase Smart Wallet…) are decoded from the embedded launchToken call.
 */
function decodeLaunchParams(input: Hex): TokenParams | null {
  const hex = input.slice(2).toLowerCase();
  for (const selector of LAUNCH_SELECTORS) {
    for (let at = hex.indexOf(selector); at !== -1; at = hex.indexOf(selector, at + 2)) {
      if (at % 2 !== 0) continue; // must start on a byte boundary
      try {
        const { functionName, args } = decodeFunctionData({ abi: ponsFactoryAbi, data: `0x${hex.slice(at)}` });
        if (functionName === "launchToken") return args[0] as TokenParams;
      } catch {
        // not a real call at this offset; keep looking
      }
    }
  }
  return null;
}

/** True when the calldata carries this site's salt tag anywhere (covers wrappers the decoder can't unpack). */
const hasSaltTag = (input: Hex) => input.toLowerCase().includes(SALT_TAG_HEX);

async function describeLaunch(client: Client, log: { args: { token?: Address; curve?: Address; deployer?: Address }; transactionHash: Hash; blockNumber: bigint }): Promise<LaunchedToken | null> {
  const { token, curve, deployer } = log.args;
  if (!token || !curve || !deployer) return null;

  // Only launches made from this site (tagged salt) are listed; skip the block lookup for anything else.
  const tx = await client.getTransaction({ hash: log.transactionHash });
  const decoded = decodeLaunchParams(tx.input);
  const params = decoded && isLaunchpadSalt(decoded.salt) ? decoded : null;
  if (!params && !hasSaltTag(tx.input)) return null;
  const [block, meta] = await Promise.all([
    client.getBlock({ blockNumber: log.blockNumber }).catch(() => null),
    // Calldata we couldn't unpack: name and symbol come from the token itself.
    params ? null : readTokenMeta(client, token),
  ]);

  return {
    token,
    curve,
    deployer,
    txHash: log.transactionHash,
    blockNumber: log.blockNumber,
    timestamp: block ? Number(block.timestamp) : undefined,
    name: params?.name ?? meta?.name ?? "",
    symbol: params?.symbol ?? meta?.symbol ?? "",
    logo: params?.logo || undefined,
    description: params?.description || undefined,
    socials: params?.socials,
  } satisfies LaunchedToken;
}

async function readTokenMeta(client: Client, token: Address) {
  const [name, symbol] = await Promise.all([
    client.readContract({ address: token, abi: erc20Abi, functionName: "name" }).catch(() => ""),
    client.readContract({ address: token, abi: erc20Abi, functionName: "symbol" }).catch(() => ""),
  ]);
  return { name, symbol };
}

/* ─────────── launches made from this browser ─────────── */

const MINE_KEY = "zeon:launch-txs";

function readMine(): Hash[] {
  try {
    const list = JSON.parse(localStorage.getItem(MINE_KEY) ?? "[]");
    return Array.isArray(list) ? list.filter((h): h is Hash => typeof h === "string" && /^0x[0-9a-fA-F]{64}$/.test(h)) : [];
  } catch {
    return [];
  }
}

/** Remembers a launch sent from this browser so Explore shows it even before (or without) the log scan reaching it. */
export function rememberLaunchTx(hash: Hash) {
  try {
    const next = [hash, ...readMine().filter((h) => h !== hash)].slice(0, 20);
    localStorage.setItem(MINE_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable; the log scan still finds it
  }
}

async function fetchMine(client: Client): Promise<LaunchedToken[]> {
  const found = await mapLimit(readMine(), 4, async (hash) => {
    try {
      const receipt = await client.getTransactionReceipt({ hash });
      if (receipt.status !== "success") return null;
      const [log] = parseEventLogs({ abi: ponsFactoryAbi, eventName: "TokenLaunched", logs: receipt.logs }).filter(
        (l) => l.address.toLowerCase() === PONS_FACTORY.toLowerCase(),
      );
      return log ? await describeLaunch(client, log) : null;
    } catch {
      return null; // not mined yet, or the RPC hiccuped; retried on the next refresh
    }
  });
  return found.filter((t): t is LaunchedToken => t !== null);
}

type Page = { items: LaunchedToken[]; nextToBlock: bigint | null };

/** Scans TokenLaunched logs backwards from `toBlock`, adapting the range to what the RPC accepts. */
async function fetchPage(client: Client, toBlock: bigint | undefined): Promise<Page> {
  const first = toBlock === undefined;
  let to = toBlock ?? (await client.getBlockNumber());
  const startedAt = Date.now();
  const items: LaunchedToken[] = first ? await fetchMine(client) : [];
  const seen = new Set(items.map((t) => t.txHash));
  let failures = 0;

  while (to >= PONS_FACTORY_DEPLOY_BLOCK && Date.now() - startedAt < PAGE_BUDGET_MS) {
    const chunk = workingChunk;
    const from = to - chunk + 1n > PONS_FACTORY_DEPLOY_BLOCK ? to - chunk + 1n : PONS_FACTORY_DEPLOY_BLOCK;
    let logs;
    try {
      logs = await client.getLogs({ address: PONS_FACTORY, event: tokenLaunchedEvent, fromBlock: from, toBlock: to });
      failures = 0;
    } catch (err) {
      if (chunk > MIN_CHUNK) {
        workingChunk = chunk / 4n > MIN_CHUNK ? chunk / 4n : MIN_CHUNK;
        continue;
      }
      if (++failures >= 3) throw err;
      continue;
    }

    const described = await mapLimit([...logs].reverse(), 4, (log) => describeLaunch(client, log).catch(() => null));
    for (const t of described) {
      if (t && !seen.has(t.txHash)) {
        seen.add(t.txHash);
        items.push(t);
      }
    }

    to = from - 1n;
    // Few logs means the RPC has headroom: widen the window for the next request.
    if (logs.length < 50 && chunk < MAX_CHUNK) workingChunk = chunk * 2n;
    if (items.length >= PAGE_SIZE) break;
  }

  items.sort((a, b) => (a.blockNumber === b.blockNumber ? 0 : a.blockNumber > b.blockNumber ? -1 : 1));
  return { items, nextToBlock: to >= PONS_FACTORY_DEPLOY_BLOCK ? to : null };
}

/** Tokens launched from this site, newest first. */
export function useExplore() {
  const client = usePublicClient({ chainId: robinhoodChain.id });
  const query = useInfiniteQuery({
    queryKey: ["explore-pons"],
    enabled: Boolean(client),
    initialPageParam: undefined as bigint | undefined,
    queryFn: ({ pageParam }) => fetchPage(client!, pageParam),
    getNextPageParam: (last) => last.nextToBlock ?? undefined,
    // A launch remembered locally can also turn up again in a later page's scan; keep the first copy.
    select: (data) => {
      const seen = new Set<string>();
      return {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          items: page.items.filter((t) => (seen.has(t.txHash) ? false : (seen.add(t.txHash), true))),
        })),
      };
    },
    // New launches show up without a manual refresh.
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  // Nothing found in the newest blocks yet: keep scanning further back on its own (a few pages at most).
  const { data, hasNextPage, isFetching, fetchNextPage } = query;
  const empty = data !== undefined && data.pages.every((p) => p.items.length === 0);
  const pages = data?.pages.length ?? 0;
  useEffect(() => {
    if (empty && hasNextPage && !isFetching && pages < AUTO_PAGES) void fetchNextPage();
  }, [empty, hasNextPage, isFetching, pages, fetchNextPage]);

  return query;
}

const AUTO_PAGES = 6;
