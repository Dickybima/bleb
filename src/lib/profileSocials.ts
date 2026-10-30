import { emptySocials, type Socials } from "./pons";
import type { SocialAccounts } from "./profile";

/** Maps a Zora profile's linked accounts onto the Pons token socials. */
export function socialsFromProfile(accounts?: SocialAccounts, website?: string): Socials {
  const s = emptySocials();
  if (accounts?.twitter?.username) s.twitter = `https://x.com/${accounts.twitter.username}`;
  if (accounts?.farcaster?.username) s.farcaster = `https://farcaster.xyz/${accounts.farcaster.username}`;
  if (website) s.website = website;
  return s;
}
