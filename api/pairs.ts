import { createPublicClient, defineChain, erc20Abi, getAbiItem, http, type Address } from "viem";
import { DEFAULT_ROBINHOOD_RPC, PONS_FACTORY, PONS_FACTORY_DEPLOY_BLOCK, pairApprovalAbi } from "../src/lib/ponsShared.js";
import { RHJ_ASSETS_URL, ROBINHOOD_CHAIN_ID, STOCKS, matchStockSymbol, parseRhjAssets } from "../src/lib/stocks.js";
import { json } from "./_zora.js";

const chain = defineChain({
  id: ROBINHOOD_CHAIN_ID,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [process.env.ROBINHOOD_RPC_URL || process.env.VITE_ROBINHOOD_RPC_URL || DEFAULT_ROBINHOOD_RPC] } },
});
const event = getAbiItem({ abi: pairApprovalAbi, name: "PairTokenApprovalUpdated" });
const makeClient = () => createPublicClient({ chain, transport: http(undefined, { timeout: 15_000 }) });
type Client = ReturnType<typeof makeClient>;

type Log = { args: { pairToken?: Address; approved?: boolean }; blockNumber: bigint; logIndex: number };

/** Fetches approval logs over a range, splitting it in half whenever the RPC rejects the span. */
async function scan(client: Client, from: bigint, to: bigint, budget: { left: number }): Promise<Log[]> {
  if (budget.left-- <= 0) throw new Error("RPC log scan budget exhausted");
  try {
    return (await client.getLogs({ address: PONS_FACTORY, event, fromBlock: from, toBlock: to })) as Log[];
  } catch (err) {
    if (to - from < 1_000n) throw err;
    const mid = from + (to - from) / 2n;
    return [...(await scan(client, from, mid, budget)), ...(await scan(client, mid + 1n, to, budget))];
  }
}

/** Pair tokens currently approved on the Pons factory, from its PairTokenApprovalUpdated history. */
async function approvedPairTokens(client: Client): Promise<Address[]> {
  const head = await client.getBlockNumber();
  const logs = await scan(client, PONS_FACTORY_DEPLOY_BLOCK, head, { left: 256 });
  logs.sort((a, b) => (a.blockNumber === b.blockNumber ? a.logIndex - b.logIndex : a.blockNumber < b.blockNumber ? -1 : 1));
  const state = new Map<string, { address: Address; approved: boolean }>();
  for (const l of logs) if (l.args.pairToken) state.set(l.args.pairToken.toLowerCase(), { address: l.args.pairToken, approved: Boolean(l.args.approved) });
  return [...state.values()].filter((s) => s.approved).map((s) => s.address);
}

/** Robinhood's asset list → logos by exact address, plus which addresses are Robinhood Stock Tokens. Failure is fine. */
async function robinhoodAssets(): Promise<Map<string, { logo?: string }>> {
  try {
    const res = await fetch(RHJ_ASSETS_URL, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return new Map();
    return new Map(parseRhjAssets(await res.json()).map((a) => [a.address.toLowerCase(), { logo: a.logo }]));
  } catch {
    return new Map();
  }
}

export type PonsPair = { address: Address; symbol: string; name?: string; logo?: string; stock: boolean };

/**
 * GET /api/pairs → every pair (quote) asset the Pons factory currently approves, same as Pons itself offers.
 * Read from the factory's PairTokenApprovalUpdated history plus each token's on-chain symbol()/name(), so the list
 * follows Pons automatically and look-alike tokens can't appear. Robinhood's asset list only adds logos.
 */
export async function GET() {
  try {
    const client = makeClient();
    const [approved, rhAssets] = await Promise.all([approvedPairTokens(client), robinhoodAssets()]);

    const pairs: PonsPair[] = await Promise.all(
      approved.map(async (address) => {
        const [symbol, name] = await Promise.all([
          client.readContract({ address, abi: erc20Abi, functionName: "symbol" }).catch(() => ""),
          client.readContract({ address, abi: erc20Abi, functionName: "name" }).catch(() => ""),
        ]);
        const rh = rhAssets.get(address.toLowerCase());
        return {
          address,
          symbol: symbol || shortSymbol(address),
          name: name || undefined,
          logo: rh?.logo,
          stock: Boolean(rh) || matchStockSymbol(symbol) !== null || /\bstock\b/i.test(name),
        };
      }),
    );
    pairs.sort(byDisplayOrder);
    return json({ pairs, source: "pons-factory" }, 200, 1800);
  } catch (err) {
    return json({ error: (err as Error).message }, 502, 0);
  }
}

const shortSymbol = (a: string) => `${a.slice(0, 6)}…`;
const stockRank = (p: PonsPair) => {
  const i = STOCKS.findIndex((s) => s.symbol === matchStockSymbol(p.symbol));
  return i < 0 ? STOCKS.length : i;
};
/** Non-stock pairs (e.g. stablecoins) first, then stocks in the familiar ticker order, then the rest A–Z. */
function byDisplayOrder(a: PonsPair, b: PonsPair) {
  if (a.stock !== b.stock) return a.stock ? 1 : -1;
  return stockRank(a) - stockRank(b) || a.symbol.localeCompare(b.symbol);
}
