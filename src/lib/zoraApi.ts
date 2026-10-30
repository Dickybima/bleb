/**
 * Browser access to Zora. Requests go through this site's /api/zora proxy (cached on the CDN, API key kept
 * server-side); when no proxy is deployed (e.g. a static host) they fall back to calling Zora directly.
 */
import { PROXY_HEADER, ZORA_API, ZoraApiError, toSearch, type Query, type ZoraPath } from "./zoraShared";

export { PROXY_HEADER, ZoraApiError };

const browserKey = import.meta.env.VITE_ZORA_API_KEY as string | undefined;

/** Like zoraGet, but resolves to null when Zora answers 404 (unknown profile). */
export async function zoraGetOrNull<T>(path: ZoraPath, query: Query): Promise<T | null> {
  try {
    return await zoraGet<T>(path, query);
  } catch (err) {
    if (err instanceof ZoraApiError && err.status === 404) return null;
    throw err;
  }
}

export async function zoraGet<T>(path: ZoraPath, query: Query): Promise<T> {
  const qs = toSearch(query);
  const viaProxy = await fetch(`/api/zora/${path}?${qs}`).catch(() => null);
  if (viaProxy?.headers.get(PROXY_HEADER)) {
    if (!viaProxy.ok) throw new ZoraApiError(viaProxy.status);
    return viaProxy.json();
  }
  const direct = await fetch(`${ZORA_API}/${path}?${qs}`, { headers: browserKey ? { "api-key": browserKey } : {} });
  if (!direct.ok) throw new ZoraApiError(direct.status);
  return direct.json();
}
