import { useEffect } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { erc20Abi, formatUnits, getAbiItem, parseAbi, type Address, type Hash, type PublicClient, type Transport } from "viem";
import { robinhoodChain } from "./chains";
import { PONS_FACTORY, PONS_FACTORY_DEPLOY_BLOCK, ponsFactoryAbi } from "./pons";
import { mapLimit } from "./util";

type Client = PublicClient<Transport, typeof robinhoodChain>;

/** Pons V2 reads and curve events (signatures from the Pons V2 builder docs, topic0 checked in pons-token-scanner). */
const marketAbi = parseAbi([
  "struct LaunchedToken { address token; address curve; address deployer; address creatorFeeRecipient; address pairToken; uint256 graduationThreshold; uint24 poolFee; int24 tickSpacing; uint16 creatorTaxBps; bool buybackEnabled; uint8 phase; uint256 sweptQuote; uint256 sweptTokens; uint256 sweptAt; bool exists; }",
  "function getLaunchedToken(address token) view returns (LaunchedToken)",
  "function getReserves() view returns (uint256 quoteReserve, uint256 tokenReserve)",
  "function realQuoteReserve() view returns (uint256)",
  "event CurveBuy(address indexed buyer, address indexed recipient, uint256 quoteIn, uint256 tokensOut, uint256 fee, uint256 tax)",
  "event CurveSell(address indexed seller, address indexed recipient, uint256 tokensIn, uint256 quoteOut, uint256 fee, uint256 tax)",
]);
const buyEvent = getAbiItem({ abi: marketAbi, name: "CurveBuy" });
const sellEvent = getAbiItem({ abi: marketAbi, name: "CurveSell" });
const launchedEvent = getAbiItem({ abi: ponsFactoryAbi, name: "TokenLaunched" });

export type Phase = "curve" | "swept" | "pool" | "rescued" | "unknown";
const PHASES: Phase[] = ["curve", "swept", "pool", "rescued"];

export type TokenInfo = {
  token: Address;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  curve?: Address;
  deployer?: Address;
  phase: Phase;
  /** Spot price in ETH per token, from the curve's reserves (only while on the curve). */
  spotEth?: number;
  /** Share of the graduation threshold already raised, 0–1. */
  progress?: number;
};

export type Trade = {
  id: string;
  kind: "buy" | "sell";
  account: Address;
  eth: number;
  tokens: number;
  /** Effective price of the trade, ETH per token. */
  priceEth: number;
  txHash: Hash;
  blockNumber: bigint;
  timestamp?: number;
};

const asNum = (v: bigint, decimals = 18) => Number(formatUnits(v, decimals));

async function readTokenInfo(client: Client, token: Address): Promise<TokenInfo> {
  const read = <T,>(p: Promise<T>) => p.catch(() => undefined);
  const [name, symbol, decimals, supply, launched] = await Promise.all([
    read(client.readContract({ address: token, abi: erc20Abi, functionName: "name" })),
    read(client.readContract({ address: token, abi: erc20Abi, functionName: "symbol" })),
    read(client.readContract({ address: token, abi: erc20Abi, functionName: "decimals" })),
    read(client.readContract({ address: token, abi: erc20Abi, functionName: "totalSupply" })),
    read(client.readContract({ address: PONS_FACTORY, abi: marketAbi, functionName: "getLaunchedToken", args: [token] })),
  ]);
  const dec = decimals ?? 18;
  const info: TokenInfo = {
    token,
    name: name ?? "",
    symbol: symbol ?? "",
    decimals: dec,
    totalSupply: supply !== undefined ? asNum(supply, dec) : 0,
    phase: "unknown",
  };
  if (!launched?.exists) return info;

  info.curve = launched.curve;
  info.deployer = launched.deployer;
  info.phase = PHASES[launched.phase] ?? "unknown";
  if (info.phase === "curve") {
    const [reserves, raised] = await Promise.all([
      read(client.readContract({ address: launched.curve, abi: marketAbi, functionName: "getReserves" })),
      read(client.readContract({ address: launched.curve, abi: marketAbi, functionName: "realQuoteReserve" })),
    ]);
    if (reserves && reserves[1] > 0n) info.spotEth = asNum(reserves[0]) / asNum(reserves[1], dec);
    if (raised !== undefined && launched.graduationThreshold > 0n)
      info.progress = Math.min(1, Number(raised) / Number(launched.graduationThreshold));
  } else {
    info.progress = 1;
  }
  return info;
}

/** Token details and live curve price, refreshed every 15 seconds. */
export function useTokenInfo(token: Address) {
  const client = usePublicClient({ chainId: robinhoodChain.id }) as Client | undefined;
  return useQuery({
    queryKey: ["token-info", token.toLowerCase()],
    enabled: Boolean(client),
    queryFn: () => readTokenInfo(client!, token),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}

/* ─────────── trades ─────────── */

const INITIAL_CHUNK = 50_000n;
const MIN_CHUNK = 500n;
const MAX_CHUNK = 500_000n;
const PAGE_BUDGET_MS = 10_000;
let workingChunk = INITIAL_CHUNK;
const blockTimes = new Map<bigint, number>();

type TradesPage = { trades: Trade[]; nextToBlock: bigint | null };

/** Walks the curve's buy/sell logs backwards from `toBlock` until the token's launch (or the time budget runs out). */
async function fetchTradesPage(client: Client, token: Address, curve: Address, decimals: number, toBlock?: bigint): Promise<TradesPage> {
  let to = toBlock ?? (await client.getBlockNumber());
  const started = Date.now();
  const trades: Trade[] = [];
  let reachedLaunch = false;
  let failures = 0;

  while (to >= PONS_FACTORY_DEPLOY_BLOCK && !reachedLaunch && Date.now() - started < PAGE_BUDGET_MS) {
    const chunk = workingChunk;
    const from = to - chunk + 1n > PONS_FACTORY_DEPLOY_BLOCK ? to - chunk + 1n : PONS_FACTORY_DEPLOY_BLOCK;
    let logs;
    try {
      // One request covers the curve's trades and the factory's launch event (to know where history starts).
      logs = await client.getLogs({ address: [curve, PONS_FACTORY], events: [buyEvent, sellEvent, launchedEvent], fromBlock: from, toBlock: to });
      failures = 0;
    } catch (err) {
      if (chunk > MIN_CHUNK) {
        workingChunk = chunk / 4n > MIN_CHUNK ? chunk / 4n : MIN_CHUNK;
        continue;
      }
      if (++failures >= 3) throw err;
      continue;
    }

    for (const log of logs) {
      const at = log.address.toLowerCase();
      if (log.eventName === "TokenLaunched") {
        if (at === PONS_FACTORY.toLowerCase() && log.args.token?.toLowerCase() === token.toLowerCase()) reachedLaunch = true;
        continue;
      }
      if (at !== curve.toLowerCase()) continue;
      const base = { id: `${log.transactionHash}:${log.logIndex}`, txHash: log.transactionHash, blockNumber: log.blockNumber };
      if (log.eventName === "CurveBuy") {
        const { recipient, buyer, quoteIn = 0n, tokensOut = 0n } = log.args;
        const eth = asNum(quoteIn), tokens = asNum(tokensOut, decimals);
        if (tokens > 0) trades.push({ ...base, kind: "buy", account: (recipient ?? buyer)!, eth, tokens, priceEth: eth / tokens });
      } else if (log.eventName === "CurveSell") {
        const { seller, tokensIn = 0n, quoteOut = 0n } = log.args;
        const eth = asNum(quoteOut), tokens = asNum(tokensIn, decimals);
        if (tokens > 0) trades.push({ ...base, kind: "sell", account: seller!, eth, tokens, priceEth: eth / tokens });
      }
    }

    to = from - 1n;
    if (logs.length < 200 && chunk < MAX_CHUNK) workingChunk = chunk * 2n;
  }

  await stampTimes(client, trades);
  trades.sort((a, b) => (a.blockNumber === b.blockNumber ? (a.id < b.id ? 1 : -1) : a.blockNumber > b.blockNumber ? -1 : 1));
  return { trades, nextToBlock: reachedLaunch || to < PONS_FACTORY_DEPLOY_BLOCK ? null : to };
}

/** Block timestamps for the trades (cached); past a few hundred blocks the rest are interpolated. */
async function stampTimes(client: Client, trades: Trade[]) {
  const blocks = [...new Set(trades.map((t) => t.blockNumber))].filter((b) => !blockTimes.has(b));
  const exact = blocks.length <= 300 ? blocks : blocks.filter((_, i) => i % Math.ceil(blocks.length / 300) === 0);
  await mapLimit(exact, 6, async (b) => {
    const block = await client.getBlock({ blockNumber: b }).catch(() => null);
    if (block) blockTimes.set(b, Number(block.timestamp));
  });
  const known = [...blockTimes.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  for (const t of trades) {
    t.timestamp = blockTimes.get(t.blockNumber);
    if (t.timestamp !== undefined || known.length < 2) continue;
    const i = known.findIndex(([b]) => b > t.blockNumber);
    const [lo, hi] = i <= 0 ? [known[0], known[1]] : [known[i - 1], known[i]];
    t.timestamp = Math.round(lo[1] + (Number(t.blockNumber - lo[0]) * (hi[1] - lo[1])) / Number(hi[0] - lo[0] || 1n));
  }
}

const AUTO_PAGES = 8;

/** Bonding-curve trades for a token, newest first; keeps loading older pages on its own until the launch. */
export function useTrades(token: Address, curve?: Address, decimals = 18) {
  const client = usePublicClient({ chainId: robinhoodChain.id }) as Client | undefined;
  const query = useInfiniteQuery({
    queryKey: ["token-trades", token.toLowerCase(), curve?.toLowerCase()],
    enabled: Boolean(client && curve),
    initialPageParam: undefined as bigint | undefined,
    queryFn: ({ pageParam }) => fetchTradesPage(client!, token, curve!, decimals, pageParam),
    getNextPageParam: (last) => last.nextToBlock ?? undefined,
    staleTime: Infinity,
  });
  const { data, hasNextPage, isFetching, fetchNextPage } = query;
  const pages = data?.pages.length ?? 0;
  useEffect(() => {
    if (hasNextPage && !isFetching && pages < AUTO_PAGES) void fetchNextPage();
  }, [hasNextPage, isFetching, pages, fetchNextPage]);
  return query;
}

/** ETH → USD from CoinGecko; undefined when unavailable (figures then stay in ETH). */
export function useEthUsd() {
  return useQuery({
    queryKey: ["eth-usd"],
    queryFn: async () => {
      const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { ethereum?: { usd?: number } };
      return body.ethereum?.usd ?? null;
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export type Candle = { time: number; open: number; high: number; low: number; close: number };

/** Groups trades (any order) into OHLC candles of `interval` seconds; each value is `value(trade)`. */
export function toCandles(trades: Trade[], interval: number, value: (t: Trade) => number): Candle[] {
  const sorted = trades.filter((t) => t.timestamp !== undefined).sort((a, b) => a.timestamp! - b.timestamp! || (a.id < b.id ? -1 : 1));
  const out: Candle[] = [];
  for (const t of sorted) {
    const time = Math.floor(t.timestamp! / interval) * interval;
    const v = value(t);
    const last = out[out.length - 1];
    if (last && last.time === time) {
      last.high = Math.max(last.high, v);
      last.low = Math.min(last.low, v);
      last.close = v;
    } else {
      // Open at the previous close so candles connect.
      const open = last ? last.close : v;
      out.push({ time, open, high: Math.max(open, v), low: Math.min(open, v), close: v });
    }
  }
  return out;
}
