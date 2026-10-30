import { FOMO_WINDOWS, normalizeLeaderboard, type FomoWindow } from "../../src/lib/fomoShared.js";
import { json } from "../_zora.js";
import { fomoApiKey, fomoFetch } from "../_fomo.js";

/** GET /api/fomo/leaderboard?window=24h|7d|30d|all → normalized fomo.family leaderboard, cached on the CDN. */
export async function GET(request: Request) {
  if (!fomoApiKey()) return json({ error: "FOMO_API_KEY belum di-set di server." }, 503, 0);
  const requested = new URL(request.url).searchParams.get("window") as FomoWindow | null;
  const window = requested && FOMO_WINDOWS.includes(requested) ? requested : "7d";

  const res = await fomoFetch(`/leaderboard/${window}`, { limit: 100 });
  if (!res.ok) return json({ error: `fomo API HTTP ${res.status}` }, res.status === 404 ? 404 : 502, 0);
  return json(normalizeLeaderboard(await res.json().catch(() => null)), 200, 600);
}
