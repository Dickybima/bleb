import { useQuery } from "@tanstack/react-query";
import { getExploreList, getProfileSocial, type ListType } from "@zoralabs/coins-sdk";
import { mapLimit } from "./util";

export type TopProfile = {
  handle: string;
  displayName?: string;
  avatar?: string;
  followers: number;
};

// Zora has no "most followed" list, so candidates are pooled from its creator lists and ranked by follower count.
const SOURCES: ListType[] = ["MOST_VALUABLE_CREATORS", "TRENDING_CREATORS", "FEATURED_CREATORS", "TOP_VOLUME_CREATORS_24H"];
const PER_SOURCE = 25;
const CONCURRENCY = 6;

async function fetchTopProfiles(): Promise<TopProfile[]> {
  const lists = await Promise.allSettled(SOURCES.map((s) => getExploreList(s, { count: PER_SOURCE })));
  const candidates = new Map<string, { handle: string; avatar?: string }>();
  for (const res of lists) {
    if (res.status !== "fulfilled") continue;
    for (const { node } of res.value.data?.exploreList.edges ?? []) {
      const p = node.creatorProfile;
      if (!p?.handle || p.platformBlocked || candidates.has(p.handle)) continue;
      candidates.set(p.handle, { handle: p.handle, avatar: p.avatar?.previewImage.small });
    }
  }
  if (candidates.size === 0) throw new Error("Zora API tidak merespons.");

  const profiles = await mapLimit([...candidates.values()], CONCURRENCY, async (c): Promise<TopProfile | null> => {
    try {
      const res = await getProfileSocial({ identifier: c.handle });
      const p = res.data?.profile;
      if (!p) return null;
      return {
        handle: p.handle,
        displayName: p.displayName,
        avatar: p.avatar?.small ?? c.avatar,
        followers: p.followers.count,
      };
    } catch {
      return null;
    }
  });

  return profiles.filter((p): p is TopProfile => p !== null).sort((a, b) => b.followers - a.followers);
}

export function useTopProfiles() {
  return useQuery({ queryKey: ["top-profiles-followers"], queryFn: fetchTopProfiles, staleTime: 5 * 60_000 });
}
