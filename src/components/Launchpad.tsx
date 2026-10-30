import { useEffect, useState, type FormEvent } from "react";
import { useAccount } from "wagmi";
import { getAddress, isAddress, type Address } from "viem";
import { useZoraProfile } from "./ProfileView";
import { Avatar } from "./Avatar";
import { ConnectButton } from "./ConnectButton";
import { LaunchSuccess } from "./LaunchSuccess";
import { TokenizeSteps } from "./TokenizeSteps";
import { robinhoodChain } from "../lib/chains";
import { LIMITS, type Socials } from "../lib/pons";
import { socialsFromProfile } from "../lib/profileSocials";
import { useTokenize } from "../lib/useTokenize";
import { shortAddr } from "../lib/format";
import { hasApiKey } from "../lib/zora";

/** Launch page. With `handle`, the form is prefilled from that Zora profile; otherwise from the connected wallet's profile. */
export function Launchpad({ handle }: { handle?: string }) {
  const { address, isConnected, chainId } = useAccount();
  const { data: profile, isPending: profileLoading } = useZoraProfile(handle ?? address);

  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">Profile Launchpad · Pons V2</span>
        <h1>Tokenize profil Zora dalam satu klik.</h1>
        <p className="muted lead">
          Ubah profil Zora menjadi token di Robinhood Chain lewat Pons V2: mulai di bonding curve, lalu otomatis lulus ke
          pool Uniswap v4 saat target likuiditas tercapai.
        </p>
        <ul className="bullets">
          <li>Nama, ticker, logo, bio, dan sosial diambil otomatis dari profil Zora</li>
          <li>Pilih profil dari Top Profile, lalu klik Tokenize</li>
          <li>Diluncurkan langsung di kontrak Pons V2, dipasangkan dengan ETH</li>
        </ul>
      </div>

      <div className="panel launch-card">
        {handle && !profileLoading && !profile ? (
          <div className="center stack">
            <h3>Profil @{handle} tidak ditemukan</h3>
            <a className="btn btn-ghost" href="#/top">Pilih dari Top Profile</a>
          </div>
        ) : !isConnected ? (
          <div className="center stack">
            {profile && <Target handle={profile.handle} name={profile.displayName} avatar={profile.avatar?.medium} />}
            <h3>Hubungkan wallet untuk meluncurkan</h3>
            <ConnectButton />
          </div>
        ) : chainId !== robinhoodChain.id ? (
          <div className="center stack">
            <h3>Jaringan salah</h3>
            <p className="muted">Token Pons diluncurkan di Robinhood Chain.</p>
            <ConnectButton />
          </div>
        ) : profileLoading ? (
          <span className="skeleton tall" />
        ) : (
          <LaunchForm
            key={`${handle ?? ""}:${address}`}
            launcher={address!}
            profile={
              profile
                ? {
                    handle: profile.handle,
                    displayName: profile.displayName,
                    description: profile.bio ?? "",
                    avatar: profile.avatar?.medium,
                    socials: socialsFromProfile(profile.socialAccounts, profile.website),
                    wallet: profile.publicWallet.walletAddress,
                    ownWallets: [profile.publicWallet.walletAddress, ...profile.linkedWallets.edges.map((e) => e.node.walletAddress)],
                  }
                : undefined
            }
          />
        )}
      </div>
    </section>
  );
}

function Target({ handle, name, avatar }: { handle: string; name?: string; avatar?: string }) {
  return (
    <div className="launch-target">
      <Avatar src={avatar} name={handle} size={44} />
      <span className="launch-target-text">
        <strong>{name || `@${handle}`}</strong>
        <small className="muted">@{handle} · profil yang ditokenisasi</small>
      </span>
      <a className="link small" href="#/top">Ganti</a>
    </div>
  );
}

type ProfileDefaults = {
  handle: string;
  displayName?: string;
  description: string;
  avatar?: string;
  socials: Socials;
  wallet: string;
  ownWallets: string[];
};

function LaunchForm({ launcher, profile }: { launcher: Address; profile?: ProfileDefaults }) {
  const tk = useTokenize();
  const { busy, error } = tk;

  const [name, setName] = useState(profile?.displayName || profile?.handle || "");
  const [symbol, setSymbol] = useState(profile?.handle.toUpperCase() ?? "");
  const [description, setDescription] = useState(profile?.description ?? "");
  const [logoUrl, setLogoUrl] = useState(profile?.avatar ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [taxPct, setTaxPct] = useState("0");
  const [buyback, setBuyback] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(profile?.avatar);

  const isOwnProfile = Boolean(profile?.ownWallets.some((w) => w.toLowerCase() === launcher.toLowerCase()));
  const profileWallet = profile && isAddress(profile.wallet) ? getAddress(profile.wallet) : undefined;
  const [feeTo, setFeeTo] = useState<"me" | "profile">("me");
  const feeRecipient = feeTo === "profile" && profileWallet ? profileWallet : launcher;

  useEffect(() => {
    if (!logoFile) return setPreview(logoUrl || undefined);
    const url = URL.createObjectURL(logoFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile, logoUrl]);

  const taxBps = Math.round(Number(taxPct) * 100);
  const canSubmit = !busy && name.trim() && symbol.trim() && tk.ready && Number.isFinite(taxBps) && taxBps >= 0;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
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
      {profile && <Target handle={profile.handle} name={profile.displayName} avatar={profile.avatar} />}

      <div className="form-top">
        <label className="image-pick" title={hasApiKey ? "Ganti logo" : "Logo dari URL"}>
          <Avatar src={preview} name={name || "?"} size={88} />
          <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} disabled={busy || !hasApiKey} />
          {hasApiKey && <span className="image-pick-hint">Ganti</span>}
        </label>
        <div className="grow stack-sm">
          <label className="field">
            <span>Nama token</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="namakamu" maxLength={LIMITS.name} disabled={busy} required />
          </label>
          <label className="field">
            <span>Ticker</span>
            <div className="prefix-input">
              <span>$</span>
              <input value={symbol} onChange={(e) => setSymbol(e.target.value.replace(/\s/g, ""))} placeholder="NAMAKAMU" maxLength={LIMITS.symbol} disabled={busy} required />
            </div>
          </label>
        </div>
      </div>

      {!logoFile && (
        <label className="field">
          <span>URL logo</span>
          <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" maxLength={LIMITS.logo} disabled={busy} />
        </label>
      )}

      <label className="field">
        <span>Bio / deskripsi</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={LIMITS.description} placeholder="Ceritakan tentang profil ini…" disabled={busy} />
      </label>

      <div className="row gap">
        <label className="field grow">
          <span>Creator tax (%)</span>
          <input type="number" min={0} step={0.1} value={taxPct} onChange={(e) => setTaxPct(e.target.value)} disabled={busy} />
        </label>
        <label className="check">
          <input type="checkbox" checked={buyback} onChange={(e) => setBuyback(e.target.checked)} disabled={busy} />
          <span>Aktifkan buyback &amp; burn</span>
        </label>
      </div>

      {profileWallet && !isOwnProfile && (
        <div className="field">
          <span>Penerima fee kreator</span>
          <div className="radio-row">
            <label><input type="radio" checked={feeTo === "me"} onChange={() => setFeeTo("me")} disabled={busy} /> Wallet saya ({shortAddr(launcher)})</label>
            <label><input type="radio" checked={feeTo === "profile"} onChange={() => setFeeTo("profile")} disabled={busy} /> Wallet profil @{profile!.handle} ({shortAddr(profileWallet)})</label>
          </div>
        </div>
      )}

      {socials.length > 0 && (
        <div className="chips">
          {socials.map(([k, v]) => <span key={k} className="chip" title={v}>{k}</span>)}
        </div>
      )}

      <dl className="summary">
        <div><dt>Jaringan</dt><dd>Robinhood Chain</dd></div>
        <div><dt>Pasangan</dt><dd>ETH</dd></div>
        <div><dt>Penerima fee</dt><dd className="mono">{shortAddr(feeRecipient)}</dd></div>
      </dl>

      {profile && !isOwnProfile && (
        <div className="notice">
          Kamu meluncurkan token untuk profil @{profile.handle} yang bukan milik wallet ini. Token ini tidak resmi dari pemilik profil.
        </div>
      )}
      {!profile && (
        <div className="notice">Wallet ini belum punya profil Zora. Isi data manual, atau pilih profil dari <a href="#/top">Top Profile</a>.</div>
      )}

      <TokenizeSteps state={tk} withUpload={Boolean(logoFile)} />
      {error && <div className="notice notice-error">{error}</div>}

      <button className="btn btn-primary btn-lg block" type="submit" disabled={!canSubmit}>
        {busy ? "Memproses…" : `Luncurkan $${symbol.toUpperCase() || "TOKEN"} di Pons`}
      </button>
    </form>
  );
}
