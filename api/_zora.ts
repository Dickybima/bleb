import { PROXY_HEADER, ZORA_API, toSearch, type Query } from "../src/lib/zoraShared.js";

const apiKey = process.env.ZORA_API_KEY || process.env.VITE_ZORA_API_KEY;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Server-side Zora GET with the API key and retries on rate limits / transient errors. */
export async function zoraFetch(path: string, query: Query, attempts = 4): Promise<Response> {
  const url = `${ZORA_API}/${path}?${toSearch(query)}`;
  let res: Response | null = null;
  for (let i = 0; i < attempts; i++) {
    res = await fetch(url, { headers: apiKey ? { "api-key": apiKey } : {} }).catch(() => null);
    if (res && res.status !== 429 && res.status < 500) return res;
    const retryAfter = Number(res?.headers.get("retry-after"));
    await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 400 * 2 ** i);
  }
  return res ?? new Response(null, { status: 502 });
}

export function json(body: unknown, status: number, cacheSeconds: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      [PROXY_HEADER]: "1",
      // Cached on Vercel's CDN; stale copies keep being served while a fresh one is fetched.
      "cache-control": status === 200 ? `public, s-maxage=${cacheSeconds}, stale-while-revalidate=86400` : "no-store",
    },
  });
}
