import { ZORA_PATHS, type ZoraPath } from "../../src/lib/zoraShared.js";
import { json, zoraFetch } from "../_zora.js";

const CACHE_SECONDS: Record<ZoraPath, number> = { explore: 120, profile: 300, profileSocial: 300 };

/** GET /api/zora/{explore|profile|profileSocial}?… → cached proxy to the Zora SDK API. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.split("/").pop() as ZoraPath;
  if (!ZORA_PATHS.includes(path)) return json({ error: "unknown path" }, 404, 0);

  const res = await zoraFetch(path, Object.fromEntries(url.searchParams));
  const body = await res.json().catch(() => ({}));
  return json(body, res.status, CACHE_SECONDS[path]);
}
