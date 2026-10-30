import { computeTopProfiles } from "../src/lib/topProfilesCore.js";
import { json, zoraFetch } from "./_zora.js";

/** GET /api/top-profiles → Zora creators ranked by followers, computed once and cached on the CDN. */
export async function GET() {
  try {
    const profiles = await computeTopProfiles(async (path, query) => {
      const res = await zoraFetch(path, query);
      if (!res.ok) throw new Error(`Zora ${path} HTTP ${res.status}`);
      return res.json();
    });
    return json(profiles, 200, 600);
  } catch (err) {
    return json({ error: (err as Error).message }, 502, 0);
  }
}
