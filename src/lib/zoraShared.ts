/** Zora REST constants and helpers shared by the browser client and the /api routes. */
export const ZORA_API = "https://api-sdk.zora.engineering";
export const ZORA_PATHS = ["explore", "profile", "profileSocial"] as const;
export type ZoraPath = (typeof ZORA_PATHS)[number];
export type Query = Record<string, string | number | undefined>;

/** Header set by our own API routes, so a plain 404 from a static host isn't mistaken for a Zora answer. */
export const PROXY_HEADER = "x-launchpad-proxy";

export class ZoraApiError extends Error {
  constructor(readonly status: number) {
    super(
      status === 429
        ? "Zora is rate-limiting us. Give it a moment and retry."
        : status >= 500
          ? `Zora is having a moment (HTTP ${status}).`
          : `Zora request failed (HTTP ${status}).`,
    );
  }
}

export function toSearch(query: Query) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== "") params.set(k, String(v));
  return params.toString();
}
