/**
 * Display metadata for pair assets. The pair list itself always comes from the Pons factory on-chain (see
 * /api/pairs); this file only knows brand colours for well-known Robinhood stock tickers and how to read logos out of
 * Robinhood's asset list. Shared by the /api routes and the browser.
 */
export const ROBINHOOD_CHAIN_ID = 4663;
export const RHJ_ASSETS_URL = "https://api.robinhood.com/rhj/assets/";

export type StockMeta = { symbol: string; name: string; color: string; fg?: string };

/** Brand colours (and display order) for well-known stock tickers' fallback logo badges. */
export const STOCKS: StockMeta[] = [
  { symbol: "NVDA", name: "NVIDIA", color: "#76B900" },
  { symbol: "SPCX", name: "SpaceX", color: "#0B0B0B" },
  { symbol: "GOOGL", name: "Alphabet", color: "#4285F4" },
  { symbol: "TSLA", name: "Tesla", color: "#E31937" },
  { symbol: "GME", name: "GameStop", color: "#E4002B" },
  { symbol: "AAPL", name: "Apple", color: "#1D1D1F" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", color: "#1F4E9C" },
  { symbol: "SNDK", name: "Sandisk", color: "#E2231A" },
  { symbol: "AMD", name: "AMD", color: "#0F0F0F" },
  { symbol: "AMZN", name: "Amazon", color: "#FF9900", fg: "#111111" },
  { symbol: "META", name: "Meta", color: "#0866FF" },
  { symbol: "CRCL", name: "Circle", color: "#21C7A8", fg: "#06281f" },
  { symbol: "MU", name: "Micron", color: "#0067B1" },
  { symbol: "PLTR", name: "Palantir", color: "#111316" },
];

/** Maps an on-chain ERC-20 symbol to one of our tickers ("TSLA", "tsla", "TSLAx" → "TSLA"), or null. */
export function matchStockSymbol(symbol: string): string | null {
  const norm = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
  for (const { symbol: t } of STOCKS) if (norm === t || norm === `${t}X` || norm === `X${t}`) return t;
  return null;
}

export type ResolvedStock = { symbol: string; name?: string; address: string; logo?: string };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const firstString = (o: Obj, keys: string[]) => {
  for (const k of keys) if (typeof o[k] === "string" && (o[k] as string).trim()) return (o[k] as string).trim();
  return undefined;
};
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

/**
 * Pulls {symbol → address} for Robinhood Chain out of Robinhood's asset list. The response shape is not documented
 * field by field, so this walks the JSON, carrying the nearest symbol down into nested deployment objects, and only
 * accepts entries whose chain is 4663 (or that carry no chain at all, ranked below explicit matches).
 */
/** With `symbols` omitted, every Robinhood Chain asset is returned. */
export function parseRhjAssets(body: unknown, symbols?: string[]): ResolvedStock[] {
  const wanted = symbols ? new Set(symbols.map((s) => s.toUpperCase())) : null;
  const found = new Map<string, ResolvedStock & { explicit: boolean }>();

  const walk = (node: unknown, ctx: { symbol?: string; name?: string; logo?: string }) => {
    if (Array.isArray(node)) return node.forEach((n) => walk(n, ctx));
    if (!isObj(node)) return;
    const symbol = (firstString(node, ["symbol", "ticker", "underlying_symbol", "underlyingSymbol", "asset_symbol"]) ?? ctx.symbol)?.toUpperCase();
    const name = firstString(node, ["name", "display_name", "displayName", "simple_name"]) ?? ctx.name;
    const logo = firstString(node, ["logo_url", "logoUrl", "icon_url", "iconUrl", "logo", "image_url", "imageUrl"]) ?? ctx.logo;
    const address = firstString(node, ["contract_address", "contractAddress", "token_address", "tokenAddress", "address", "evm_address"]);
    const chainRaw = node.chain_id ?? node.chainId ?? node.network_id ?? node.networkId;
    const chainOk = chainRaw === undefined || Number(chainRaw) === ROBINHOOD_CHAIN_ID;

    if (symbol && (!wanted || wanted.has(symbol)) && address && ADDRESS.test(address) && chainOk) {
      const explicit = chainRaw !== undefined;
      const prev = found.get(symbol);
      if (!prev || (explicit && !prev.explicit)) found.set(symbol, { symbol, name, address, logo: logo?.startsWith("https://") ? logo : undefined, explicit });
    }
    for (const v of Object.values(node)) if (typeof v === "object") walk(v, { symbol, name, logo });
  };

  walk(body, {});
  return [...found.values()].map(({ explicit: _explicit, ...rest }) => rest);
}
