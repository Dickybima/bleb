import { useEffect, useState, type FormEvent } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { base } from "wagmi/chains";
import type { Address, Hash } from "viem";
import { useZoraProfile } from "./ProfileView";
import { Avatar } from "./Avatar";
import { ConnectButton } from "./ConnectButton";
import { deployCreatorCoin, fetchCreatorPoolConfig, uploadMetadata } from "../lib/launch";
import { fmtUsd, shortAddr } from "../lib/format";
import { profileHref } from "../lib/router";
import { basescanTxUrl, hasApiKey, PLATFORM_REFERRER, zoraCoinUrl } from "../lib/zora";
import { zeroAddress } from "viem";

type Step = "idle" | "upload" | "config" | "sign" | "confirm" | "done";

const STEP_LABEL: Record<Exclude<Step, "idle" | "done">, string> = {
  upload: "Upload metadata ke IPFS",
  config: "Ambil pool config creator coin",
  sign: "Tanda tangani transaksi di wallet",
  confirm: "Menunggu konfirmasi di Base",
};

export function Launchpad() {
  const { address, isConnected, chainId } = useAccount();
  const { data: profile, isPending: profileLoading } = useZoraProfile(address);

  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">Zora Creator Coin Launchpad</span>
        <h1>Tokenize profil Zora kamu dalam satu klik.</h1>
        <p className="muted lead">
          Ubah profil kamu menjadi creator coin di Base: dipasangkan dengan $ZORA, likuiditas langsung di Uniswap v4,
          dan kamu menerima reward dari setiap trade.
        </p>
        <ul className="bullets">
          <li>Supply tetap 1 miliar, sebagian di-vesting ke kreator</li>
          <li>Langsung bisa di-trade di Zora &amp; Base</li>
          <li>Fee trading mengalir ke wallet kamu</li>
        </ul>
      </div>

      <div className="panel launch-card">
        {!isConnected ? (
          <div className="center stack">
            <h3>Hubungkan wallet untuk mulai</h3>
            <p className="muted">Gunakan wallet yang terhubung ke profil Zora kamu.</p>
            <ConnectButton />
          </div>
        ) : chainId !== base.id ? (
          <div className="center stack">
            <h3>Jaringan salah</h3>
            <p className="muted">Creator coin diluncurkan di Base.</p>
            <ConnectButton />
          </div>
        ) : profileLoading ? (
          <span className="skeleton tall" />
        ) : profile?.creatorCoin ? (
          <AlreadyTokenized
            handle={profile.handle}
            avatar={profile.avatar?.medium}
            coin={profile.creatorCoin.address}
            marketCap={profile.creatorCoin.marketCap}
          />
        ) : (
          <LaunchForm
            key={address}
            creator={address!}
            defaults={{
              handle: profile?.handle,
              description: profile?.bio ?? "",
              avatar: profile?.avatar?.medium,
            }}
          />
        )}
      </div>
    </section>
  );
}

function AlreadyTokenized({ handle, avatar, coin, marketCap }: { handle: string; avatar?: string; coin: string; marketCap: string }) {
  return (
    <div className="center stack">
      <Avatar src={avatar} name={handle} size={72} />
      <h3>@{handle} sudah ditokenisasi 🎉</h3>
      <p className="muted">Market cap saat ini {fmtUsd(marketCap)} · {shortAddr(coin)}</p>
      <div className="row gap center-row">
        <a className="btn btn-ghost" href={profileHref(handle)}>Lihat profil</a>
        <a className="btn btn-primary" href={zoraCoinUrl(coin)} target="_blank" rel="noreferrer">Trade di Zora ↗</a>
      </div>
    </div>
  );
}

function LaunchForm({
  creator,
  defaults,
}: {
  creator: Address;
  defaults: { handle?: string; description: string; avatar?: string };
}) {
  const publicClient = usePublicClient({ chainId: base.id });
  const { data: walletClient } = useWalletClient({ chainId: base.id });

  const [name, setName] = useState(defaults.handle ?? "");
  const [symbol, setSymbol] = useState(defaults.handle ?? "");
  const [description, setDescription] = useState(defaults.description);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [metadataUri, setMetadataUri] = useState("");
  const [preview, setPreview] = useState<string | undefined>(defaults.avatar);

  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [coin, setCoin] = useState<Address | null>(null);

  useEffect(() => {
    if (!imageFile) return setPreview(defaults.avatar);
    const url = URL.createObjectURL(imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile, defaults.avatar]);

  const busy = step !== "idle" && step !== "done";
  const image = imageFile ?? defaults.avatar;
  const canSubmit =
    !busy && name.trim() && symbol.trim() && walletClient && publicClient &&
    (hasApiKey ? Boolean(image) : /^(ipfs|https?|ar):\/\//.test(metadataUri.trim()));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!walletClient || !publicClient) return;
    setError(null);
    setTxHash(null);
    try {
      let uri = metadataUri.trim();
      if (hasApiKey) {
        setStep("upload");
        uri = await uploadMetadata({ creator, name: name.trim(), symbol: symbol.trim(), description, image: image! });
      }
      setStep("config");
      const poolConfig = await fetchCreatorPoolConfig();
      setStep("sign");
      const result = await deployCreatorCoin({
        walletClient,
        publicClient,
        account: creator,
        uri,
        name: name.trim(),
        symbol: symbol.trim(),
        poolConfig,
        onHash: (h) => {
          setTxHash(h);
          setStep("confirm");
        },
      });
      setCoin(result.coin ?? null);
      setStep("done");
    } catch (err) {
      const e = err as { shortMessage?: string; message?: string };
      setError(e.shortMessage ?? e.message ?? String(err));
      setStep("idle");
    }
  };

  if (step === "done") {
    return (
      <div className="center stack">
        <span className="orb big" aria-hidden />
        <h3>${symbol.toUpperCase()} berhasil diluncurkan!</h3>
        {coin && <p className="muted mono">{coin}</p>}
        <div className="row gap center-row">
          {txHash && <a className="btn btn-ghost" href={basescanTxUrl(txHash)} target="_blank" rel="noreferrer">Lihat transaksi ↗</a>}
          {coin && <a className="btn btn-primary" href={zoraCoinUrl(coin)} target="_blank" rel="noreferrer">Buka di Zora ↗</a>}
        </div>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="form-top">
        <label className="image-pick" title="Ganti gambar coin">
          <Avatar src={preview} name={name || "?"} size={88} />
          <input type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" hidden
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} disabled={busy || !hasApiKey} />
          {hasApiKey && <span className="image-pick-hint">Ganti</span>}
        </label>
        <div className="grow stack-sm">
          <label className="field">
            <span>Nama coin</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="namakamu" maxLength={64} disabled={busy} required />
          </label>
          <label className="field">
            <span>Ticker</span>
            <div className="prefix-input">
              <span>$</span>
              <input value={symbol} onChange={(e) => setSymbol(e.target.value.replace(/\s/g, ""))} placeholder="NAMAKAMU" maxLength={20} disabled={busy} required />
            </div>
          </label>
        </div>
      </div>

      <label className="field">
        <span>Deskripsi</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Ceritakan tentang kamu…" disabled={busy} />
      </label>

      {!hasApiKey && (
        <label className="field">
          <span>Metadata URI</span>
          <input value={metadataUri} onChange={(e) => setMetadataUri(e.target.value)} placeholder="ipfs://…" disabled={busy} required />
          <small className="muted">
            Set <code>VITE_ZORA_API_KEY</code> agar gambar &amp; metadata di-upload otomatis. Tanpa itu, isi URI JSON metadata (name, symbol, description, image) yang sudah di-pin di IPFS.
          </small>
        </label>
      )}

      <dl className="summary">
        <div><dt>Jaringan</dt><dd>Base</dd></div>
        <div><dt>Pasangan</dt><dd>$ZORA</dd></div>
        <div><dt>Penerima fee</dt><dd className="mono">{shortAddr(creator)}</dd></div>
        {PLATFORM_REFERRER !== zeroAddress && <div><dt>Referrer</dt><dd className="mono">{shortAddr(PLATFORM_REFERRER)}</dd></div>}
      </dl>

      {!defaults.handle && (
        <div className="notice">Wallet ini belum punya profil Zora. Coin tetap bisa diluncurkan, tapi tidak akan muncul sebagai creator coin profil di Zora.</div>
      )}

      {busy && (
        <ol className="steps">
          {(Object.keys(STEP_LABEL) as (keyof typeof STEP_LABEL)[])
            .filter((s) => hasApiKey || s !== "upload")
            .map((s) => {
              const order = ["upload", "config", "sign", "confirm"];
              const state = order.indexOf(s) < order.indexOf(step) ? "done" : s === step ? "active" : "";
              return <li key={s} className={state}>{STEP_LABEL[s]}</li>;
            })}
          {txHash && <li className="muted"><a href={basescanTxUrl(txHash)} target="_blank" rel="noreferrer">tx {shortAddr(txHash)} ↗</a></li>}
        </ol>
      )}

      {error && <div className="notice notice-error">{error}</div>}

      <button className="btn btn-primary btn-lg block" type="submit" disabled={!canSubmit}>
        {busy ? "Memproses…" : `Luncurkan $${symbol.toUpperCase() || "COIN"}`}
      </button>
    </form>
  );
}
