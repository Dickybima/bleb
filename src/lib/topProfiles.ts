import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SCOPE_OPTIONS, computeTopProfiles, type TopProfile, type TopProfilesScope } from "./topProfilesCore";
import { PROXY_HEADER, ZoraApiError, zoraGet } from "./zoraApi";

export type { TopProfile, TopProfilesScope };

const queryKey = (scope: TopProfilesScope) => ["top-profiles-followers", scope] as const;
const storageKey = (scope: TopProfilesScope) => `zeon:top-profiles:${scope}`;

async function fetchTopProfiles(scope: TopProfilesScope): Promise<TopProfile[]> {
  // Prefer the cached server-side ranking: one request instead of hundreds of Zora calls from the browser.
  const res = await fetch(`/api/top-profiles?scope=${scope}`).catch(() => null);
  let profiles: TopProfile[] | null = null;
  if (res?.headers.get(PROXY_HEADER)) {
    if (!res.ok) throw new ZoraApiError(res.status);
    const body = await res.json();
    if (Array.isArray(body)) profiles = body.filter((p): p is TopProfile => typeof p?.handle === "string");
  }
  // Browser fallback stays lighter so it doesn't trip Zora's rate limit.
  profiles ??= await computeTopProfiles((path, query) => zoraGet(path, query), {
    ...SCOPE_OPTIONS[scope],
    concurrency: 3,
    maxCandidates: Math.min(SCOPE_OPTIONS[scope].maxCandidates ?? 200, 200),
  });
  saveCached(scope, profiles);
  return profiles;
}

/** Last ranking seen in this browser, shown instantly on the next visit while a fresh one loads. */
function loadCached(scope: TopProfilesScope): { data: TopProfile[]; at: number } | undefined {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(scope)) ?? "null");
    if (raw && Array.isArray(raw.data) && raw.data.length > 0 && typeof raw.at === "number") return raw;
  } catch {
    // ignore unreadable storage
  }
  return undefined;
}

function saveCached(scope: TopProfilesScope, data: TopProfile[]) {
  if (data.length === 0) return;
  try {
    localStorage.setItem(storageKey(scope), JSON.stringify({ data, at: Date.now() }));
  } catch {
    // storage full or blocked; the in-memory query still works
  }
}

/** `home` is the quick ranking for Home; `full` is the deep pool behind the Top Profiles page. */
export function useTopProfiles(scope: TopProfilesScope = "home") {
  const queryClient = useQueryClient();
  const cached = loadCached(scope);
  return useQuery({
    queryKey: queryKey(scope),
    queryFn: () => fetchTopProfiles(scope),
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.at,
    // While the full ranking loads, show the quick one if Home already fetched it.
    placeholderData: () => (scope === "full" ? queryClient.getQueryData<TopProfile[]>(queryKey("home")) : undefined),
    staleTime: 5 * 60_000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
}
