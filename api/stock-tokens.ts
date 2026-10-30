import { createPublicClient, defineChain, erc20Abi, getAbiItem, http, type Address } from "viem";
import { DEFAULT_ROBINHOOD_RPC, PONS_FACTORY, PONS_FACTORY_DEPLOY_BLOCK, pairApprovalAbi } from "../src/lib/ponsShared.js";
import { RHJ_ASSETS_URL, ROBINHOOD_CHAIN_ID, STOCKS, matchStockSymbol, parseRhjAssets, type ResolvedStock } from "../src/lib/stocks.js";
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

/** Robinhood's asset list, only used for logos (matched by exact address). Failure is fine. */
async function robinhoodLogos(): Promise<Map<string, string>> {
  try {
    const res = await fetch(RHJ_ASSETS_URL, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return new Map();
    const assets = parseRhjAssets(await res.json(), STOCKS.map((s) => s.symbol));
    return new Map(assets.filter((a) => a.logo).map((a) => [a.address.toLowerCase(), a.logo!]));
  } catch {
    return new Map();
  }
}

/**
 * GET /api/stock-tokens → the supported stocks that Pons has approved as pair assets, with their addresses.
 * Source of truth is the Pons factory itself, so only tokens Pons accepts (never look-alikes) can appear.
 */
export async function GET() {
  try {
    const client = makeClient();
    const [approved, logos] = await Promise.all([approvedPairTokens(client), robinhoodLogos()]);

    const described = await Promise.all(
      approved.map(async (address) => {
        const [symbol, name] = await Promise.all([
          client.readContract({ address, abi: erc20Abi, functionName: "symbol" }).catch(() => ""),
          client.readContract({ address, abi: erc20Abi, functionName: "name" }).catch(() => ""),
        ]);
        return { address, symbol, name };
      }),
    );

    const tokens: ResolvedStock[] = [];
    for (const t of described) {
      const ticker = matchStockSymbol(t.symbol);
      if (!ticker || tokens.some((x) => x.symbol === ticker)) continue;
      tokens.push({ symbol: ticker, name: t.name || undefined, address: t.address, logo: logos.get(t.address.toLowerCase()) });
    }
    // Every approved pair (e.g. USDG) is listed too, so it's easy to see what Pons accepts.
    const approvedPairs = described.map((t) => ({ symbol: t.symbol, address: t.address }));
    return json({ tokens, approvedPairs, source: "pons-factory" }, 200, 1800);
  } catch (err) {
    return json({ error: (err as Error).message }, 502, 0);
  }
}
