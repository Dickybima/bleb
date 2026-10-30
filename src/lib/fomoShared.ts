/**
 * fomo.family data via the getfomoapi.fun developer API (independent service, not an official fomo product).
 * Shared by the /api/fomo routes and the browser. The upstream response shapes are not documented field by field,
 * so the normalizers below accept the field names fomo's own API is known to use plus common alternatives.
 */
export const FOMO_API = "https://getfomoapi.fun/api";

export type FomoRow = {
  handle: string;
  displayName?: string;
  avatar?: string;
  followers?: number;
};

export type FomoUser = FomoRow & {
  bio?: string;
  twitter?: string;
  website?: string;
  /** EVM wallet, when the profile exposes one. */
  wallet?: string;
};

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

function pick(o: Obj, keys: string[]): unknown {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== "") return o[k];
  return undefined;
}
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const num = (v: unknown) => {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
};

/** Unwraps fomo's `{ success, responseObject }` envelope. */
export const unwrap = (body: unknown): unknown => (isObj(body) && "responseObject" in body ? body.responseObject : body);

function userFields(raw: Obj): FomoUser | null {
  const u = isObj(raw.user) ? { ...raw, ...raw.user } : raw;
  const handle = str(pick(u, ["userHandle", "handle", "username", "userName"]))?.replace(/^@/, "");
  if (!handle) return null;
  const evm = pick(u, ["evm", "evmAddress", "evmWallet", "ethAddress"]);
  const wallet = str(Array.isArray(evm) ? evm[0] : isObj(evm) ? pick(evm, ["address", "walletAddress"]) : evm);
  const twitter = str(pick(u, ["twitterHandle", "twitterUsername", "xHandle", "twitter"]));
  return {
    handle,
    displayName: str(pick(u, ["displayName", "name", "fullName"])),
    avatar: str(pick(u, ["profilePictureUrl", "profilePicture", "profileImageUrl", "pfpUrl", "avatarUrl", "avatar", "imageUrl", "image"])),
    followers: num(pick(u, ["followerCount", "followersCount", "numFollowers", "followers"])),
    bio: str(pick(u, ["bio", "description", "about"])),
    twitter: twitter?.replace(/^@/, "").replace(/^https?:\/\/(x|twitter)\.com\//, ""),
    website: str(pick(u, ["website", "websiteUrl", "url"])),
    wallet: wallet && /^0x[0-9a-fA-F]{40}$/.test(wallet) ? wallet : undefined,
  };
}

export function normalizeUser(body: unknown): FomoUser | null {
  const inner = unwrap(body);
  return isObj(inner) ? userFields(inner) : null;
}
