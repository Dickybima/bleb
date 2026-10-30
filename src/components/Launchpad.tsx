import { useEffect, useState, type FormEvent } from "react";
import { useAccount } from "wagmi";
import { useChainModal, useConnectModal } from "@rainbow-me/rainbowkit";
import { getAddress, isAddress, type Address } from "viem";
import { useZoraProfile } from "../lib/profile";
import { Avatar } from "./Avatar";
import { LaunchSuccess } from "./LaunchSuccess";
import { TokenizeSteps } from "./TokenizeSteps";
import { robinhoodChain } from "../lib/chains";
import { LIMITS, type Socials } from "../lib/pons";
import { socialsFromProfile } from "../lib/profileSocials";
import { useTokenize } from "../lib/useTokenize";
import { shortAddr } from "../lib/format";
import { hasApiKey } from "../lib/zora";
import { useFomoProfile, type FomoUser } from "../lib/fomo";
import type { ProfileSource } from "../lib/router";
import { emptySocials } from "../lib/pons";

const SOURCE_LABEL: Record<ProfileSource, string> = { zora: "Zora", fomo: "Fomo" };

function fomoDefaults(p: FomoUser): ProfileDefaults {
  const socials = emptySocials();
  if (p.twitter) socials.twitter = `https://x.com/${p.twitter}`;
  if (p.website) socials.website = p.website;
  return {
    source: "fomo",
    handle: p.handle,
    displayName: p.displayName,
    description: p.bio ?? "",
    avatar: p.avatar,
    socials,
    wallet: p.wallet,
    ownWallets: p.wallet ? [p.wallet] : [],
  };
}

/**
 * Launch page. With `handle`, the form is prefilled from that Zora or fomo profile;
 * otherwise from the connected wallet's Zora profile.
 */
export function Launchpad({ handle, source = "zora" }: { handle?: string; source?: ProfileSource }) {
  const { address } = useAccount();
  const isFomo = Boolean(handle) && source === "fomo";
  const zoraQuery = useZoraProfile(isFomo ? undefined : (handle ?? address));
  const fomoQuery = useFomoProfile(isFomo ? handle : undefined);
  const profileQuery = isFomo ? fomoQuery : zoraQuery;
  const zoraProfile = zoraQuery.data;
  const loading = Boolean(handle ?? address) && profileQuery.isPending;

  const profile: ProfileDefaults | undefined = isFomo
    ? fomoQuery.data
      ? fomoDefaults(fomoQuery.data)
      : undefined
    : zoraProfile
      ? {
          source: "zora",
          handle: zoraProfile.handle,
          displayName: zoraProfile.displayName,
          description: zoraProfile.bio,
          avatar: zoraProfile.avatar,
          socials: socialsFromProfile(zoraProfile.socialAccounts, zoraProfile.website),
          wallet: zoraProfile.wallet,
          ownWallets: zoraProfile.wallets,
        }
      : undefined;

  const card = (
    <div className="panel launch-card">
      {profileQuery.isError ? (
        <div className="notice notice-error">
          Couldn't load the {SOURCE_LABEL[source]} profile: {(profileQuery.error as Error).message}{" "}
          <button className="link" onClick={() => profileQuery.refetch()}>Retry</button>
        </div>
      ) : handle && !loading && !profile ? (
        <div className="center stack">
          <h3>@{handle} isn't on {SOURCE_LABEL[source]}</h3>
          <a className="btn btn-ghost" href="#/top">Browse top profiles</a>
        </div>
      ) : loading ? (
        <span className="skeleton tall" />
      ) : (
        <LaunchForm key={`${source}:${handle ?? address ?? ""}`} profile={profile} />
      )}
    </div>
  );

  if (handle) {
    return (
      <section className="launch-page">
        <a className="link small muted" href="#/top">← Back to Top Profiles</a>
        <h1>Tokenize @{handle}</h1>
        <p className="muted">Pre-loaded from @{handle}'s {SOURCE_LABEL[source]} profile. Tweak anything, then send it.</p>
        {card}
      </section>
    );
  }

  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">FOZO · Robinhood Chain</span>
        <h1>Mint the clout.</h1>
        <p className="muted lead">
          FOZO turns any Zora or Fomo profile into a live token on Robinhood Chain. It's born on a bonding curve,
          graduates to Uniswap v4 once the crowd shows up, and from there the price is set by belief, not a pitch deck.
        </p>
        <ul className="bullets">
          <li>Name, ticker, avatar, bio and socials lifted straight from the profile. Zero copy-paste.</li>
          <li>Pick a creator from Top Profiles, hit Tokenize, sign once.</li>
          <li>Fully on-chain, paired with ETH, creator fees routed to the wallet you choose.</li>
        </ul>
      </div>
      {card}
    </section>
  );
}

function Target({ handle, name, avatar, source }: { handle: string; name?: string; avatar?: string; source: ProfileSource }) {
  return (
    <div className="launch-target">
      <Avatar src={avatar} name={handle} size={44} />
      <span className="launch-target-text">
        <strong>{name || `@${handle}`}</strong>
        <small className="muted">@{handle} · {SOURCE_LABEL[source]} profile</small>
      </span>
      <a className="link small" href="#/top">Change</a>
    </div>
  );
}

type ProfileDefaults = {
  source: ProfileSource;
  handle: string;
  displayName?: string;
  description: string;
  avatar?: string;
  socials: Socials;
  wallet?: string;
  ownWallets: string[];
};

function LaunchForm({ profile }: { profile?: ProfileDefaults }) {
  const { address: launcher, isConnected, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { openChainModal } = useChainModal();
  const onChain = isConnected && chainId === robinhoodChain.id;
  const tk = useTokenize();
  const { busy, error } = tk;

  const [name, setName] = useState(profile?.displayName || profile?.handle || "");
  // Tickers stay alphanumeric: "@PoorGoat_" → "POORGOAT".
  const [symbol, setSymbol] = useState(profile ? profile.handle.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || profile.handle.toUpperCase() : "");
  const [description, setDescription] = useState(profile?.description ?? "");
  const [logoUrl, setLogoUrl] = useState(profile?.avatar ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [taxPct, setTaxPct] = useState("0");
  const [buyback, setBuyback] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(profile?.avatar);

  const isOwnProfile = Boolean(launcher && profile?.ownWallets.some((w) => w.toLowerCase() === launcher.toLowerCase()));
  const profileWallet = profile?.wallet && isAddress(profile.wallet) ? getAddress(profile.wallet) : undefined;
  const [feeTo, setFeeTo] = useState<"me" | "profile">("me");
  const feeRecipient: Address | undefined = feeTo === "profile" && profileWallet ? profileWallet : launcher;

  useEffect(() => {
    if (!logoFile) return setPreview(logoUrl || undefined);
    const url = URL.createObjectURL(logoFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile, logoUrl]);

  const taxBps = Math.round(Number(taxPct) * 100);
  const formValid = Boolean(name.trim() && symbol.trim()) && Number.isFinite(taxBps) && taxBps >= 0;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isConnected || !launcher) return openConnectModal?.();
    if (!onChain) return openChainModal?.();
    tk.tokenize({
      creator: launcher,
      feeRecipient,
      name: name.trim(),
      symbol: symbol.trim(),
      description,
      logo: logoFile ?? logoUrl.trim(),
      socials: profile?.socials ?? { twitter: "", telegram: "", discord: "", website: "", farcaster: "" },
      creatorTaxBps: taxBps,
      buybackEnabled: buyback,
    });
  };

  if (tk.step === "done") return <LaunchSuccess state={tk} symbol={symbol} />;

  const socials = Object.entries(profile?.socials ?? {}).filter(([, v]) => v);

  return (
    <form className="form" onSubmit={onSubmit}>
      {profile && <Target handle={profile.handle} name={profile.displayName} avatar={profile.avatar} source={profile.source} />}

      <div className="form-top">
        <label className="image-pick" title={hasApiKey ? "Change logo" : "Logo from URL"}>
          <Avatar src={preview} name={name || "?"} size={88} />
          <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} disabled={busy || !hasApiKey} />
          {hasApiKey && <span className="image-pick-hint">Change</span>}
        </label>
        <div className="grow stack-sm">
          <label className="field">
            <span>Token name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="yourname" maxLength={LIMITS.name} disabled={busy} required />
          </label>
          <label className="field">
            <span>Ticker</span>
            <div className="prefix-input">
              <span>$</span>
              <input value={symbol} onChange={(e) => setSymbol(e.target.value.replace(/\s/g, ""))} placeholder="YOURNAME" maxLength={LIMITS.symbol} disabled={busy} required />
            </div>
          </label>
        </div>
      </div>

      {!logoFile && (
        <label className="field">
          <span>Logo URL</span>
          <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" maxLength={LIMITS.logo} disabled={busy} />
        </label>
      )}

      <label className="field">
        <span>Bio</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={LIMITS.description} placeholder="The story behind this profile…" disabled={busy} />
      </label>

      <div className="row gap">
        <label className="field grow">
          <span>Creator tax (%)</span>
          <input type="number" min={0} step={0.1} value={taxPct} onChange={(e) => setTaxPct(e.target.value)} disabled={busy} />
        </label>
        <label className="check">
          <input type="checkbox" checked={buyback} onChange={(e) => setBuyback(e.target.checked)} disabled={busy} />
          <span>Enable buyback &amp; burn</span>
        </label>
      </div>

      {profileWallet && launcher && !isOwnProfile && (
        <div className="field">
          <span>Creator fees go to</span>
          <div className="radio-row">
            <label><input type="radio" checked={feeTo === "me"} onChange={() => setFeeTo("me")} disabled={busy} /> My wallet ({shortAddr(launcher)})</label>
            <label><input type="radio" checked={feeTo === "profile"} onChange={() => setFeeTo("profile")} disabled={busy} /> @{profile!.handle}'s wallet ({shortAddr(profileWallet)})</label>
          </div>
        </div>
      )}

      {socials.length > 0 && (
        <div className="chips">
          {socials.map(([k, v]) => <span key={k} className="chip" title={v}>{k}</span>)}
        </div>
      )}

      <dl className="summary">
        <div><dt>Network</dt><dd>Robinhood Chain</dd></div>
        <div><dt>Paired with</dt><dd>ETH</dd></div>
        <div><dt>Fee recipient</dt><dd className={feeRecipient ? "mono" : undefined}>{feeRecipient ? shortAddr(feeRecipient) : "Your wallet"}</dd></div>
      </dl>

      {profile && launcher && !isOwnProfile && (
        <div className="notice">
          Heads up: you're launching a token for @{profile.handle} from a wallet that isn't theirs. It's a community token, not an official one.
        </div>
      )}
      {!profile && launcher && (
        <div className="notice">No Zora profile on this wallet. Fill it in yourself, or pick a creator from <a href="#/top">Top Profiles</a>.</div>
      )}

      <TokenizeSteps state={tk} withUpload={Boolean(logoFile)} />
      {error && <div className="notice notice-error">{error}</div>}

      <button className="btn btn-primary btn-lg block" type="submit" disabled={busy || !formValid || (onChain && !tk.ready)}>
        {busy
          ? "Launching…"
          : !isConnected
            ? "Connect wallet to launch"
            : !onChain
              ? "Switch to Robinhood Chain"
              : `Launch $${symbol.toUpperCase() || "TOKEN"}`}
      </button>
    </form>
  );
}
