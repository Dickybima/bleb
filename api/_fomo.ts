import { FOMO_API } from "../src/lib/fomoShared.js";
import { toSearch, type Query } from "../src/lib/zoraShared.js";

export const fomoApiKey = () => process.env.FOMO_API_KEY;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** GET against getfomoapi.fun with the API key; retries on 429 (5 req/s limit) and transient errors. */
export async function fomoFetch(path: string, query: Query = {}, attempts = 4): Promise<Response> {
  const qs = toSearch(query);
  const url = `${FOMO_API}${path}${qs ? `?${qs}` : ""}`;
  let res: Response | null = null;
  for (let i = 0; i < attempts; i++) {
    res = await fetch(url, { headers: { accept: "application/json", "X-API-Key": fomoApiKey() ?? "" } }).catch(() => null);
    if (res && res.status !== 429 && res.status < 500) return res;
    const retryAfter = Number(res?.headers.get("retry-after"));
    await sleep(Math.max(Number.isFinite(retryAfter) ? retryAfter * 1000 : 0, 500 * 2 ** i));
  }
  return res ?? new Response(null, { status: 502 });
}
