import { FOMO_PROFILES, type FomoProfile } from "../data/fomoProfiles";
import type { TopProfile } from "./topProfilesCore";

export const fomoProfileUrl = (handle: string) => `https://fomo.family/${handle}`;

const byHandle = new Map(FOMO_PROFILES.map((p) => [p.handle.replace(/^@/, "").toLowerCase(), p]));

export function findFomoProfile(handle: string): FomoProfile | undefined {
  return byHandle.get(handle.replace(/^@/, "").toLowerCase());
}

/** Fomo profiles ranked by followers, in the same shape as the Zora ranking. */
export const fomoTopProfiles: TopProfile[] = FOMO_PROFILES.filter((p) => p.handle && Number.isFinite(p.followers))
  .map((p) => ({ handle: p.handle.replace(/^@/, ""), displayName: p.displayName, avatar: p.avatar, followers: p.followers }))
  .sort((a, b) => b.followers - a.followers);
