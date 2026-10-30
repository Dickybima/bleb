import { useQuery } from "@tanstack/react-query";
import { zoraGetOrNull } from "./zoraApi";

type SocialAccount = { username?: string; displayName?: string; followerCount?: number };
export type SocialAccounts = Partial<Record<"twitter" | "farcaster" | "instagram" | "tiktok", SocialAccount>>;

/** A Zora profile with every field the UI touches made safe; Zora sometimes omits nested objects. */
export type ZoraProfile = {
  handle: string;
  displayName?: string;
  bio: string;
  website?: string;
  avatar?: string;
  avatarSmall?: string;
  wallet?: string;
  /** Public wallet plus linked wallets. */
  wallets: string[];
  socialAccounts: SocialAccounts;
  followers?: number;
  following?: number;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export function normalizeProfile(raw: any): ZoraProfile | null {
  if (!raw || typeof raw !== "object" || typeof raw.handle !== "string" || !raw.handle) return null;
  const wallet = typeof raw.publicWallet?.walletAddress === "string" ? raw.publicWallet.walletAddress : undefined;
  const linked: string[] = Array.isArray(raw.linkedWallets?.edges)
    ? raw.linkedWallets.edges.map((e: any) => e?.node?.walletAddress).filter((w: unknown): w is string => typeof w === "string")
    : [];
  return {
    handle: raw.handle,
    displayName: typeof raw.displayName === "string" && raw.displayName ? raw.displayName : undefined,
    bio: typeof raw.bio === "string" ? raw.bio : "",
    website: typeof raw.website === "string" && raw.website ? raw.website : undefined,
    avatar: raw.avatar?.medium || raw.avatar?.small || undefined,
    avatarSmall: raw.avatar?.small || raw.avatar?.medium || undefined,
    wallet,
    wallets: [...(wallet ? [wallet] : []), ...linked],
    socialAccounts: raw.socialAccounts && typeof raw.socialAccounts === "object" ? raw.socialAccounts : {},
    followers: typeof raw.followers?.count === "number" ? raw.followers.count : undefined,
    following: typeof raw.following?.count === "number" ? raw.following.count : undefined,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const retry = { retry: 3, retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 8000) };

/** Basic profile (by handle or wallet address). */
export function useZoraProfile(identifier?: string) {
  return useQuery({
    ...retry,
    queryKey: ["profile", identifier?.toLowerCase()],
    enabled: Boolean(identifier),
    queryFn: async () => normalizeProfile((await zoraGetOrNull<{ profile?: unknown }>("profile", { identifier: identifier! }))?.profile),
  });
}

/** Profile including follower / following counts. */
export function useZoraProfileSocial(identifier: string) {
  return useQuery({
    ...retry,
    queryKey: ["profile-social", identifier.toLowerCase()],
    queryFn: async () => normalizeProfile((await zoraGetOrNull<{ profile?: unknown }>("profileSocial", { identifier }))?.profile),
  });
}
