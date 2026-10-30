import { emptySocials, type Socials } from "./pons";

type ZoraSocialAccounts = Partial<Record<"twitter" | "farcaster" | "instagram" | "tiktok", { username?: string } | undefined>>;

/** Maps a Zora profile's linked accounts onto the Pons token socials. */
export function socialsFromProfile(accounts?: ZoraSocialAccounts, website?: string): Socials {
  const s = emptySocials();
  if (accounts?.twitter?.username) s.twitter = `https://x.com/${accounts.twitter.username}`;
  if (accounts?.farcaster?.username) s.farcaster = `https://farcaster.xyz/${accounts.farcaster.username}`;
  if (website) s.website = website;
  return s;
}
