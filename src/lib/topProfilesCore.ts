import type { ExploreResponse, GetProfileSocialResponse } from "@zoralabs/coins-sdk";

type GetExploreResponse = NonNullable<ExploreResponse["data"]>;
import { mapLimit } from "./util.js";

export type TopProfile = {
  handle: string;
  displayName?: string;
  avatar?: string;
  followers: number;
};

type Get = <T>(path: "explore" | "profileSocial", query: Record<string, string | number>) => Promise<T>;

// Zora has no "most followed" list, so candidates are pooled from its creator lists and ranked by follower count.
const SOURCES = ["MOST_VALUABLE_CREATORS", "TRENDING_CREATORS", "FEATURED_CREATORS", "TOP_VOLUME_CREATORS_24H"];
const PER_SOURCE = 25;

/** Shared by the /api/top-profiles route and the browser fallback. */
export async function computeTopProfiles(get: Get, concurrency = 6): Promise<TopProfile[]> {
  const lists = await Promise.allSettled(SOURCES.map((listType) => get<GetExploreResponse>("explore", { listType, count: PER_SOURCE })));
  const candidates = new Map<string, { handle: string; avatar?: string }>();
  for (const res of lists) {
    if (res.status !== "fulfilled") continue;
    for (const { node } of res.value.exploreList?.edges ?? []) {
      const p = node.creatorProfile;
      if (!p?.handle || p.platformBlocked || candidates.has(p.handle)) continue;
      candidates.set(p.handle, { handle: p.handle, avatar: p.avatar?.previewImage.small });
    }
  }
  if (candidates.size === 0) {
    const failed = lists.find((r): r is PromiseRejectedResult => r.status === "rejected");
    throw failed?.reason ?? new Error("Zora API tidak mengembalikan data creator.");
  }

  const profiles = await mapLimit([...candidates.values()], concurrency, async (c): Promise<TopProfile | null> => {
    try {
      const p = (await get<GetProfileSocialResponse>("profileSocial", { identifier: c.handle })).profile;
      if (!p) return null;
      return { handle: p.handle, displayName: p.displayName, avatar: p.avatar?.small ?? c.avatar, followers: p.followers.count };
    } catch {
      return null;
    }
  });

  return profiles.filter((p): p is TopProfile => p !== null).sort((a, b) => b.followers - a.followers);
}
