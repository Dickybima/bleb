import { SCOPE_OPTIONS, computeTopProfiles } from "../src/lib/topProfilesCore.js";
import { json, zoraFetch } from "./_zora.js";

/**
 * GET /api/top-profiles[?scope=home] → Zora creators ranked by followers, computed once and cached on the CDN.
 * `home` is the quick ranking used on Home; the default is the full pool for the Top Profiles page.
 */
export async function GET(request: Request) {
  const scope = new URL(request.url).searchParams.get("scope") === "home" ? "home" : "full";
  try {
    const profiles = await computeTopProfiles(async (path, query) => {
      const res = await zoraFetch(path, query);
      if (!res.ok) throw new Error(`Zora ${path} HTTP ${res.status}`);
      return res.json();
    }, SCOPE_OPTIONS[scope]);
    // A thin or partly uncounted list (Zora rate limits) is only cached briefly so it heals on the next request.
    const complete = profiles.length >= (scope === "home" ? 20 : 50) && profiles.every((p) => p.followers !== undefined);
    return json(profiles, 200, complete ? 600 : 60);
  } catch (err) {
    return json({ error: (err as Error).message }, 502, 0);
  }
}
