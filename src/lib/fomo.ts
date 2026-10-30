import { useQuery } from "@tanstack/react-query";
import { FOMO_PROFILES } from "../data/fomoProfiles";
import type { FomoRow, FomoUser, FomoWindow } from "./fomoShared";
import { PROXY_HEADER } from "./zoraShared";

export type { FomoRow, FomoUser, FomoWindow };

export const fomoProfileUrl = (handle: string) => `https://fomo.family/${handle}`;

const clean = (h: string) => h.replace(/^@/, "").toLowerCase();

/** Curated fallback (src/data/fomoProfiles.ts), used when the fomo API isn't configured or reachable. */
const manualProfiles: FomoUser[] = FOMO_PROFILES.filter((p) => p.handle && Number.isFinite(p.followers)).map((p) => ({
  ...p,
  handle: p.handle.replace(/^@/, ""),
}));
const manualRows: FomoRow[] = [...manualProfiles].sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0));

type Result<T> = { data: T; source: "api" | "manual"; note?: string };

/** Calls one of our /api/fomo routes; null means "no usable API" (not deployed, or no key) so callers fall back. */
async function fomoRoute<T>(path: string): Promise<{ status: number; body: T } | null> {
  const res = await fetch(path).catch(() => null);
  if (!res?.headers.get(PROXY_HEADER) || res.status === 503) return null;
  return { status: res.status, body: res.ok ? await res.json() : (null as T) };
}

export function useFomoLeaderboard(window: FomoWindow) {
  return useQuery({
    queryKey: ["fomo-leaderboard", window],
    staleTime: 5 * 60_000,
    retry: 2,
    queryFn: async (): Promise<Result<FomoRow[]>> => {
      const res = await fomoRoute<FomoRow[]>(`/api/fomo/leaderboard?window=${window}`);
      if (!res) return { data: manualRows, source: "manual" };
      if (res.status !== 200 || !Array.isArray(res.body)) throw new Error(`fomo API gagal (HTTP ${res.status}).`);
      return { data: res.body.filter((r) => typeof r?.handle === "string"), source: "api" };
    },
  });
}

export function useFomoProfile(handle?: string) {
  return useQuery({
    queryKey: ["fomo-profile", handle && clean(handle)],
    enabled: Boolean(handle),
    staleTime: 5 * 60_000,
    retry: 2,
    queryFn: async (): Promise<FomoUser | null> => {
      const manual = manualProfiles.find((p) => clean(p.handle) === clean(handle!)) ?? null;
      const res = await fomoRoute<FomoUser>(`/api/fomo/user?handle=${encodeURIComponent(clean(handle!))}`);
      if (!res) return manual;
      if (res.status === 404) return manual;
      if (res.status !== 200 || !res.body?.handle) throw new Error(`fomo API gagal (HTTP ${res.status}).`);
      // Curated entries can fill gaps the API leaves (e.g. bio, wallet).
      return { ...manual, ...Object.fromEntries(Object.entries(res.body).filter(([, v]) => v !== undefined)) } as FomoUser;
    },
  });
}
