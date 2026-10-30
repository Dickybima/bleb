import type { GetProfileSocialResponse } from "@zoralabs/coins-sdk";
import { mapLimit } from "./util.js";

export type TopProfile = {
  handle: string;
  displayName?: string;
  avatar?: string;
  /** Larger avatar (Zora "medium") for big surfaces like the hero cards. */
  avatarLarge?: string;
  /** Missing when Zora wouldn't return the count (e.g. rate limited); such profiles rank last. */
  followers?: number;
};

type Get = <T>(path: "explore" | "profileSocial", query: Record<string, string | number>) => Promise<T>;

// Zora has no "most followed" list, so candidates are pooled from its creator (and all-coin) lists, a few pages
// deep, and ranked by follower count.
const CREATOR_SOURCES = ["MOST_VALUABLE_CREATORS", "TRENDING_CREATORS", "FEATURED_CREATORS", "TOP_VOLUME_CREATORS_24H", "NEW_CREATORS"];
const ALL_SOURCES = ["MOST_VALUABLE_ALL", "TRENDING_ALL", "TOP_VOLUME_ALL_24H"];

export type TopProfilesOptions = {
  /** Parallel profileSocial lookups. */
  concurrency?: number;
  /** Pages fetched per list (cursor pagination). */
  pages?: number;
  /** Items requested per page. */
  perPage?: number;
  /** Include the mixed (posts + creators) lists; their coins' creators widen the pool. */
  allLists?: boolean;
  /** Upper bound on profiles looked up. */
  maxCandidates?: number;
  /** Extra, gentler passes over lookups that failed (usually rate limits). */
  retryPasses?: number;
  /** Stop retrying after this many ms from the start. */
  deadlineMs?: number;
};

type ExploreEdge = { node?: { creatorProfile?: { handle?: string; platformBlocked?: boolean; avatar?: { previewImage?: { small?: string } } } } };
type ExplorePage = { exploreList?: { edges?: ExploreEdge[]; pageInfo?: { endCursor?: string; hasNextPage?: boolean } } };

/** Shared by the /api/top-profiles route and the browser fallback. */
export async function computeTopProfiles(get: Get, opts: TopProfilesOptions = {}): Promise<TopProfile[]> {
  const { concurrency = 6, pages = 1, perPage = 25, allLists = false, maxCandidates = 150, retryPasses = 2, deadlineMs = 45_000 } = opts;
  const startedAt = Date.now();
  const sources = allLists ? [...CREATOR_SOURCES, ...ALL_SOURCES] : CREATOR_SOURCES;

  // Walk each list page by page; a failed page only ends that list.
  const walk = async (listType: string): Promise<ExploreEdge[]> => {
    const edges: ExploreEdge[] = [];
    let after: string | undefined;
    for (let i = 0; i < pages; i++) {
      const query: Record<string, string | number> = { listType, count: perPage };
      if (after) query.after = after;
      let page: ExplorePage;
      try {
        page = await get<ExplorePage>("explore", query);
      } catch (err) {
        if (i === 0) throw err;
        break;
      }
      edges.push(...(page?.exploreList?.edges ?? []));
      after = page?.exploreList?.pageInfo?.endCursor;
      if (!after || page?.exploreList?.pageInfo?.hasNextPage === false) break;
    }
    return edges;
  };

  const lists = await Promise.allSettled(sources.map(walk));
  const candidates = new Map<string, { handle: string; avatar?: string }>();
  for (const res of lists) {
    if (res.status !== "fulfilled") continue;
    for (const edge of res.value) {
      const p = edge?.node?.creatorProfile;
      if (!p?.handle || p.platformBlocked || candidates.has(p.handle)) continue;
      candidates.set(p.handle, { handle: p.handle, avatar: p.avatar?.previewImage?.small });
    }
  }
  if (candidates.size === 0) {
    const failed = lists.find((r): r is PromiseRejectedResult => r.status === "rejected");
    throw failed?.reason ?? new Error("Zora returned no creator data.");
  }

  const pool = [...candidates.values()].slice(0, maxCandidates);
  const resolved = new Map<string, TopProfile | null>(); // null = Zora has no usable profile

  const lookup = async (c: { handle: string; avatar?: string }) => {
    try {
      const p = (await get<GetProfileSocialResponse>("profileSocial", { identifier: c.handle }))?.profile;
      resolved.set(
        c.handle,
        p?.handle && typeof p.followers?.count === "number"
          ? {
              handle: p.handle,
              displayName: p.displayName,
              avatar: p.avatar?.small ?? c.avatar,
              avatarLarge: p.avatar?.medium ?? p.avatar?.small ?? c.avatar,
              followers: p.followers.count,
            }
          : null,
      );
    } catch {
      // Left unresolved; retried below.
    }
  };

  await mapLimit(pool, concurrency, lookup);
  for (let pass = 0; pass < retryPasses; pass++) {
    const failed = pool.filter((c) => !resolved.has(c.handle));
    if (failed.length === 0 || Date.now() - startedAt > deadlineMs) break;
    await new Promise((r) => setTimeout(r, 1500 * (pass + 1)));
    await mapLimit(failed, Math.max(1, Math.floor(concurrency / 3)), lookup);
  }

  // Lookups that never succeeded still show, without a count, after every counted profile.
  const out = pool.map((c) => (resolved.has(c.handle) ? resolved.get(c.handle) : { handle: c.handle, avatar: c.avatar, avatarLarge: c.avatar }));
  return out
    .filter((p): p is TopProfile => p != null)
    .sort((a, b) => (b.followers ?? -1) - (a.followers ?? -1));
}
