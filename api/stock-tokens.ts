import { RHJ_ASSETS_URL, STOCKS, parseRhjAssets } from "../src/lib/stocks.js";
import { json } from "./_zora.js";

const MAX_PAGES = 10;

/** GET /api/stock-tokens → Robinhood Chain addresses for the supported stock pairs, from Robinhood's asset list. */
export async function GET() {
  try {
    const pages: unknown[] = [];
    let url: string | null = RHJ_ASSETS_URL;
    for (let i = 0; url && i < MAX_PAGES; i++) {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`Robinhood assets HTTP ${res.status}`);
      const body = (await res.json()) as { next?: unknown };
      pages.push(body);
      url = typeof body?.next === "string" && body.next.startsWith("https://api.robinhood.com/") ? body.next : null;
    }
    const tokens = parseRhjAssets(pages, STOCKS.map((s) => s.symbol));
    return json({ tokens }, 200, 3600);
  } catch (err) {
    return json({ error: (err as Error).message }, 502, 0);
  }
}
