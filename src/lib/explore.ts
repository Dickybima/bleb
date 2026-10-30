import { useInfiniteQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { decodeFunctionData, erc20Abi, getAbiItem, type Address, type Hash, type Hex, type PublicClient, type Transport } from "viem";
import { robinhoodChain } from "./chains";
import {
  PONS_FACTORY,
  PONS_FACTORY_DEPLOY_BLOCK,
  isLaunchpadSalt,
  ponsFactoryAbi,
  ponsLaunchAndBuyAbi,
  type Socials,
} from "./pons";
import { mapLimit } from "./util";

export type ExploreScope = "launchpad" | "all";

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
  fromLaunchpad: boolean;
};

type Client = PublicClient<Transport, typeof robinhoodChain>;

const PAGE_SIZE = 12;
const INITIAL_CHUNK = 50_000n;
const MIN_CHUNK = 500n;
/** Upper bound on log requests per page so a sparse range can't stall the UI. */
const MAX_REQUESTS_PER_PAGE = 40;

const tokenLaunchedEvent = getAbiItem({ abi: ponsFactoryAbi, name: "TokenLaunched" });

type TokenParams = {
  name: string;
  symbol: string;
  logo: string;
  description: string;
  socials: Socials;
  salt: Hex;
};

/** Recovers the launch params from the transaction calldata (direct factory call or launch-and-buy router). */
function decodeLaunchParams(input: Hex): TokenParams | null {
  for (const abi of [ponsFactoryAbi, ponsLaunchAndBuyAbi] as const) {
    try {
      const { functionName, args } = decodeFunctionData({ abi, data: input });
      if (functionName === "launchToken" || functionName === "launchAndBuy") return args[0] as TokenParams;
    } catch {
      // not this ABI
    }
  }
  return null;
}

async function describeLaunch(client: Client, log: { args: { token?: Address; curve?: Address; deployer?: Address }; transactionHash: Hash; blockNumber: bigint }) {
  const { token, curve, deployer } = log.args;
  if (!token || !curve || !deployer) return null;

  const [tx, block] = await Promise.all([
    client.getTransaction({ hash: log.transactionHash }),
    client.getBlock({ blockNumber: log.blockNumber }).catch(() => null),
  ]);
  const params = decodeLaunchParams(tx.input);

  let name = params?.name ?? "";
  let symbol = params?.symbol ?? "";
  if (!params) {
    [name, symbol] = await Promise.all([
      client.readContract({ address: token, abi: erc20Abi, functionName: "name" }).catch(() => ""),
      client.readContract({ address: token, abi: erc20Abi, functionName: "symbol" }).catch(() => ""),
    ]);
  }

  return {
    token,
    curve,
    deployer,
    txHash: log.transactionHash,
    blockNumber: log.blockNumber,
    timestamp: block ? Number(block.timestamp) : undefined,
    name,
    symbol,
    logo: params?.logo || undefined,
    description: params?.description || undefined,
    socials: params?.socials,
    fromLaunchpad: params ? isLaunchpadSalt(params.salt) : false,
  } satisfies LaunchedToken;
}

type Page = { items: LaunchedToken[]; nextToBlock: bigint | null };

/** Scans TokenLaunched logs backwards from `toBlock`, shrinking the range when the RPC rejects a request. */
async function fetchPage(client: Client, scope: ExploreScope, toBlock: bigint | undefined): Promise<Page> {
  let to = toBlock ?? (await client.getBlockNumber());
  let chunk = INITIAL_CHUNK;
  const items: LaunchedToken[] = [];

  for (let requests = 0; requests < MAX_REQUESTS_PER_PAGE && to >= PONS_FACTORY_DEPLOY_BLOCK; requests++) {
    const from = to - chunk + 1n > PONS_FACTORY_DEPLOY_BLOCK ? to - chunk + 1n : PONS_FACTORY_DEPLOY_BLOCK;
    let logs;
    try {
      logs = await client.getLogs({ address: PONS_FACTORY, event: tokenLaunchedEvent, fromBlock: from, toBlock: to });
    } catch (err) {
      if (chunk <= MIN_CHUNK) throw err;
      chunk /= 4n;
      continue;
    }

    const described = await mapLimit([...logs].reverse(), 4, (log) => describeLaunch(client, log).catch(() => null));
    for (const t of described) if (t && (scope === "all" || t.fromLaunchpad)) items.push(t);

    to = from - 1n;
    if (logs.length === 0 && chunk < INITIAL_CHUNK * 4n) chunk *= 2n;
    if (items.length >= PAGE_SIZE) break;
  }

  return { items, nextToBlock: to >= PONS_FACTORY_DEPLOY_BLOCK ? to : null };
}

export const exploreQueryKey = (scope: ExploreScope) => ["explore-pons", scope] as const;

export function useExplore(scope: ExploreScope) {
  const client = usePublicClient({ chainId: robinhoodChain.id });
  return useInfiniteQuery({
    queryKey: exploreQueryKey(scope),
    enabled: Boolean(client),
    initialPageParam: undefined as bigint | undefined,
    queryFn: ({ pageParam }) => fetchPage(client!, scope, pageParam),
    getNextPageParam: (last) => last.nextToBlock ?? undefined,
    // New launches show up without a manual refresh.
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
