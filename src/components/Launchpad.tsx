import { useEffect, useState, type FormEvent } from "react";
import { useAccount } from "wagmi";
import type { Address } from "viem";
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

export function Launchpad() {
  const { address, isConnected, chainId } = useAccount();
  const { data: profile, isPending: profileLoading } = useZoraProfile(address);

  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">Profile Launchpad · Pons V2</span>
        <h1>Tokenize profil kamu dalam satu klik.</h1>
        <p className="muted lead">
          Ubah profil Zora kamu menjadi token di Robinhood Chain lewat Pons V2: mulai di bonding curve, lalu otomatis
          lulus ke pool Uniswap v4 saat target likuiditas tercapai.
        </p>
        <ul className="bullets">
          <li>Nama, logo, bio, dan sosial diambil otomatis dari profil Zora</li>
          <li>Fee kreator dan creator tax mengalir ke wallet kamu</li>
          <li>Diluncurkan langsung di kontrak Pons V2, dipasangkan dengan ETH</li>
        </ul>
      </div>

      <div className="panel launch-card">
        {!isConnected ? (
          <div className="center stack">
            <h3>Hubungkan wallet untuk mulai</h3>
            <p className="muted">Gunakan wallet yang terhubung ke profil Zora kamu.</p>
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
            key={address}
            creator={address!}
            defaults={{
              handle: profile?.handle,
              description: profile?.bio ?? "",
              avatar: profile?.avatar?.medium,
              socials: socialsFromProfile(profile?.socialAccounts, profile?.website),
            }}
          />
        )}
      </div>
    </section>
  );
}

function LaunchForm({
  creator,
  defaults,
}: {
  creator: Address;
  defaults: { handle?: string; description: string; avatar?: string; socials: Socials };
}) {
  const tk = useTokenize();
  const { busy, error } = tk;

  const [name, setName] = useState(defaults.handle ?? "");
  const [symbol, setSymbol] = useState(defaults.handle?.toUpperCase() ?? "");
  const [description, setDescription] = useState(defaults.description);
  const [logoUrl, setLogoUrl] = useState(defaults.avatar ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [taxPct, setTaxPct] = useState("0");
  const [buyback, setBuyback] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(defaults.avatar);

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
      creator,
      name: name.trim(),
      symbol: symbol.trim(),
      description,
      logo: logoFile ?? logoUrl.trim(),
      socials: defaults.socials,
      creatorTaxBps: taxBps,
      buybackEnabled: buyback,
    });
  };

  if (tk.step === "done") return <LaunchSuccess state={tk} symbol={symbol} />;

  const socials = Object.entries(defaults.socials).filter(([, v]) => v);

  return (
    <form className="form" onSubmit={onSubmit}>
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
        <span>Deskripsi</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={LIMITS.description} placeholder="Ceritakan tentang kamu…" disabled={busy} />
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

      {socials.length > 0 && (
        <div className="chips">
          {socials.map(([k, v]) => <span key={k} className="chip" title={v}>{k}</span>)}
        </div>
      )}

      <dl className="summary">
        <div><dt>Jaringan</dt><dd>Robinhood Chain</dd></div>
        <div><dt>Pasangan</dt><dd>ETH</dd></div>
        <div><dt>Penerima fee</dt><dd className="mono">{shortAddr(creator)}</dd></div>
      </dl>

      {!defaults.handle && (
        <div className="notice">Wallet ini belum punya profil Zora. Token tetap bisa diluncurkan, isi data secara manual.</div>
      )}

      <TokenizeSteps state={tk} withUpload={Boolean(logoFile)} />
      {error && <div className="notice notice-error">{error}</div>}

      <button className="btn btn-primary btn-lg block" type="submit" disabled={!canSubmit}>
        {busy ? "Memproses…" : `Luncurkan $${symbol.toUpperCase() || "TOKEN"} di Pons`}
      </button>
    </form>
  );
}
