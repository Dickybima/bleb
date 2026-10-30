import { computeTopProfiles } from "../src/lib/topProfilesCore.js";
import { json, zoraFetch } from "./_zora.js";

/** GET /api/top-profiles → Zora creators ranked by followers, computed once and cached on the CDN. */
export async function GET() {
  try {
    const profiles = await computeTopProfiles(async (path, query) => {
      const res = await zoraFetch(path, query);
      if (!res.ok) throw new Error(`Zora ${path} HTTP ${res.status}`);
      return res.json();
    }, { concurrency: 10, pages: 4, perPage: 50, allLists: true, maxCandidates: 500 });
    // A thin or partly uncounted list (Zora rate limits) is only cached briefly so it heals on the next request.
    const complete = profiles.length >= 50 && profiles.every((p) => p.followers !== undefined);
    return json(profiles, 200, complete ? 600 : 60);
  } catch (err) {
    return json({ error: (err as Error).message }, 502, 0);
  }
}
