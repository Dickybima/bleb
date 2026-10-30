import { useQuery } from "@tanstack/react-query";
import { computeTopProfiles, type TopProfile } from "./topProfilesCore";
import { PROXY_HEADER, ZoraApiError, zoraGet } from "./zoraApi";

export type { TopProfile };

async function fetchTopProfiles(): Promise<TopProfile[]> {
  // Prefer the cached server-side ranking: one request instead of ~100 Zora calls from the browser.
  const res = await fetch("/api/top-profiles").catch(() => null);
  if (res?.headers.get(PROXY_HEADER)) {
    if (!res.ok) throw new ZoraApiError(res.status);
    const body = await res.json();
    if (Array.isArray(body)) return body.filter((p): p is TopProfile => typeof p?.handle === "string");
  }
  // Browser fallback stays lighter so it doesn't trip Zora's rate limit.
  return computeTopProfiles((path, query) => zoraGet(path, query), { concurrency: 3, pages: 2, perPage: 50, maxCandidates: 200 });
}

export function useTopProfiles() {
  return useQuery({
    queryKey: ["top-profiles-followers"],
    queryFn: fetchTopProfiles,
    staleTime: 5 * 60_000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
}
