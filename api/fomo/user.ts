import { normalizeUser } from "../../src/lib/fomoShared.js";
import { json } from "../_zora.js";
import { fomoApiKey, fomoFetch } from "../_fomo.js";

/** GET /api/fomo/user?handle=… → normalized fomo.family profile (404 when unknown), cached on the CDN. */
export async function GET(request: Request) {
  if (!fomoApiKey()) return json({ error: "FOMO_API_KEY is not set on the server." }, 503, 0);
  const handle = new URL(request.url).searchParams.get("handle")?.replace(/^@/, "").trim();
  if (!handle || !/^[\w.-]{1,64}$/.test(handle)) return json({ error: "invalid handle" }, 400, 0);

  const res = await fomoFetch(`/users/${encodeURIComponent(handle)}`);
  if (res.status === 404) return json({ error: "not found" }, 404, 0);
  if (!res.ok) return json({ error: `fomo API HTTP ${res.status}` }, 502, 0);
  const user = normalizeUser(await res.json().catch(() => null));
  return user ? json(user, 200, 600) : json({ error: "not found" }, 404, 0);
}
