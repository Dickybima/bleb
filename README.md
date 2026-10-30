# ZEON

**Turn reach into a market.** ZEON turns any **Zora** profile into a live token on Robinhood Chain, launched through
Pons V2. Tokens are born on a bonding curve and graduate to Uniswap v4 once the crowd
shows up.

## Features

- **Home / Launch**: the Home page has the hero, a bento section (live handle detection, profile → token flow,
  combined reach, latest mints, non-custodial) and top profiles; the **Launch** page (`#/launch`) is a two-step studio
  (1. detect a Zora profile by handle or connected wallet, 2. review every coin field and launch): connect a wallet and its Zora profile is detected automatically, prefilling name, ticker,
  logo (avatar), description (bio) and socials (X, Farcaster, website). Creator tax and buyback & burn are
  configurable. Tokens launch via `launchToken` on the Pons V2 factory
  `0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e`, paired with ETH: bonding curve first, then Uniswap v4.
- **Top Zora Profiles**: Zora profiles ranked by followers (no price or market cap data); the home hero fans out
  the top five as clickable cards. Candidates are pooled from Zora's creator lists (most valuable, trending, featured,
  top volume, new) plus the mixed coin lists, several pages deep (up to ~500 profiles); each profile's follower
  count is read via `getProfileSocial`.
- **Tokenize button** (on Top Profiles and profile pages): opens the launch form `#/launch/<handle>` directly,
  prefilled with the profile's name, ticker, logo, bio and socials. The form renders before a wallet is
  connected; the wallet is requested only on submit. When the profile isn't owned by the connected wallet, the
  form shows a notice and lets the launcher choose the creator-fee recipient: their own wallet or the profile's.
- **Explore**: only tokens launched from this site (other Pons launches are filtered out). Read straight from
  the Pons V2 factory's `TokenLaunched` events (no backend), newest first, refreshed every 30 seconds and right
  after a successful launch. This site's launches are recognised by a 6-byte tag at the start of the `salt`
  (`keccak256("profile-launchpad/v1")`), read back from the transaction calldata.
- **Connect wallet**: RainbowKit modal with MetaMask, Coinbase Wallet, Rabby, OKX, Trust, Rainbow,
  WalletConnect (QR for mobile wallets), Phantom, Bitget, Binance, Uniswap, Zerion, Brave, Ledger, Safe and other
  browser wallets. Installed wallets are detected automatically.
- **Profile page**: search `@handle` or `0x…` to see bio, socials, followers and following.

## Launch flow (Pons V2)

1. Read `launchEnabled`, `canLaunch(wallet)`, `launchFee` and `maxCreatorTaxBps` from the factory.
2. Pick the launch config (`VITE_PONS_LAUNCH_CONFIG_ID`, or the first active config).
3. `previewLaunchEconomics(configId, ETH)` → `expectedEconomics`.
4. Simulate, then send `launchToken(params, configId, ETH, [])` with `value = launchFee`
   (falls back to the overload without `snipeTaxExemptions`).
5. Read the token and curve addresses from the `TokenLaunched` event.

The ABI comes from the third-party SDK `0xfnzero/pons-trade-sdk` and was checked against its official
signatures; re-verify against the Pons docs (docs.ponsfamily.com/v2) before production.

## API (Vercel Functions)

All Zora data goes through the serverless functions in `api/` (enabled automatically on Vercel):

- `GET /api/top-profiles`: the Top Zora Profiles ranking, computed once on the server and cached on the CDN for
  10 minutes (`stale-while-revalidate` 1 day). The browser makes one request instead of ~100 Zora calls.
- `GET /api/zora/{explore|profile|profileSocial}`: cached proxy to the Zora API.

The server uses `ZORA_API_KEY` (kept secret, never shipped to the browser) and retries automatically when Zora
answers 429/5xx. In `npm run dev`, `/api/zora` is proxied by Vite and Top Zora Profiles is computed in the
browser as a fallback.

## Running locally

```bash
npm install
cp .env.example .env   # set VITE_WALLETCONNECT_PROJECT_ID (free at cloud.reown.com)
npm run dev
```

Production build: `npm run build` (output in `dist/`, a static site plus `api/` functions on Vercel).

## Stack

Vite + React + TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), shadcn/ui structure, `motion` for animation,
`lucide-react` icons, wagmi/viem + RainbowKit (Robinhood Chain), `@zoralabs/coins-sdk` (Zora profile data and IPFS
uploads).

## UI structure (shadcn)

- `components.json`: shadcn config (zinc base color, CSS variables, `@/` aliases), so `npx shadcn@latest add <component>`
  drops new primitives into the right place.
- `src/index.css`: Tailwind entry, shadcn theme tokens (light + `.dark`), fonts.
- `src/lib/utils.ts`: `cn()` helper (clsx + tailwind-merge).
- `src/components/ui/`: shared primitives: `card.tsx`, `hero-with-cards.tsx` (+ demo) with its
  `hero-with-cards-utils/orb-button.tsx`, and `primitives.tsx` (Panel, Reveal, SectionHeading, Notice, input styles).
- Dark mode is class-based (`html.dark`), dark by default, toggled from the navbar/footer and remembered per browser.

> Not an official Zora or Pons app. New tokens are extremely risky.
