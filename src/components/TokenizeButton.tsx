import { useAccount } from "wagmi";
import { base } from "wagmi/chains";
import type { Address } from "viem";
import { ConnectButton } from "./ConnectButton";
import { TokenizeSteps } from "./TokenizeSteps";
import { useTokenize } from "../lib/useTokenize";
import { shortAddr } from "../lib/format";
import { basescanTxUrl, hasApiKey, zoraCoinUrl } from "../lib/zora";

type Props = {
  handle: string;
  bio: string;
  avatar?: string;
  /** Wallets that belong to the profile; only these may tokenize it. */
  wallets: string[];
};

/** One-click tokenize: deploys the profile's creator coin using its handle, bio and avatar. */
export function TokenizeButton({ handle, bio, avatar, wallets }: Props) {
  const { address, isConnected, chainId } = useAccount();
  const tk = useTokenize();

  if (tk.step === "done") {
    return (
      <div className="tokenize done">
        <div>
          <strong>${handle.toUpperCase()} berhasil diluncurkan 🎉</strong>
          {tk.coin && <p className="muted mono">{tk.coin}</p>}
        </div>
        <div className="row gap">
          {tk.txHash && <a className="btn btn-ghost" href={basescanTxUrl(tk.txHash)} target="_blank" rel="noreferrer">Transaksi ↗</a>}
          {tk.coin && <a className="btn btn-primary" href={zoraCoinUrl(tk.coin)} target="_blank" rel="noreferrer">Buka di Zora ↗</a>}
        </div>
      </div>
    );
  }

  const isOwner = Boolean(address && wallets.some((w) => w.toLowerCase() === address.toLowerCase()));

  let blocker: React.ReactNode = null;
  if (!hasApiKey) blocker = <>Set <code>VITE_ZORA_API_KEY</code> untuk mengaktifkan tokenize otomatis.</>;
  else if (!isConnected) blocker = "Hubungkan wallet pemilik profil ini untuk tokenize.";
  else if (chainId !== base.id) blocker = "Pindah ke jaringan Base untuk tokenize.";
  else if (!isOwner) blocker = `Wallet ${shortAddr(address)} bukan milik @${handle}. Hanya pemilik profil yang bisa tokenize.`;

  return (
    <div className="tokenize">
      <div>
        <strong>Profil ini belum ditokenisasi</strong>
        <p className="muted">
          Sekali klik: creator coin <b>${handle.toUpperCase()}</b> dibuat dari handle, bio, dan avatar profil ini, dipasangkan dengan $ZORA di Base.
        </p>
        {blocker && <p className="muted small">{blocker}</p>}
        <TokenizeSteps state={tk} withUpload />
        {tk.error && <div className="notice notice-error">{tk.error}</div>}
      </div>
      {!isConnected || chainId !== base.id ? (
        <ConnectButton />
      ) : (
        <button
          className="btn btn-primary btn-lg"
          disabled={Boolean(blocker) || tk.busy || !tk.ready}
          onClick={() =>
            tk.tokenize({ creator: address as Address, name: handle, symbol: handle, description: bio, image: avatar })
          }
        >
          {tk.busy ? "Memproses…" : "Tokenize"}
        </button>
      )}
    </div>
  );
}
