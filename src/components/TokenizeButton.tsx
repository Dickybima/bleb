import { useAccount } from "wagmi";
import type { Address } from "viem";
import { ConnectButton } from "./ConnectButton";
import { LaunchSuccess } from "./LaunchSuccess";
import { TokenizeSteps } from "./TokenizeSteps";
import { robinhoodChain } from "../lib/chains";
import type { Socials } from "../lib/pons";
import { useTokenize } from "../lib/useTokenize";
import { shortAddr } from "../lib/format";

type Props = {
  handle: string;
  bio: string;
  avatar?: string;
  socials: Socials;
  /** Wallets that belong to the profile; only these may tokenize it. */
  wallets: string[];
};

/** One-click tokenize: launches the profile's token on Pons V2 from its handle, bio, avatar and socials. */
export function TokenizeButton({ handle, bio, avatar, socials, wallets }: Props) {
  const { address, isConnected, chainId } = useAccount();
  const tk = useTokenize();
  const symbol = handle.toUpperCase();

  if (tk.step === "done") return <div className="tokenize done"><LaunchSuccess state={tk} symbol={symbol} /></div>;

  const isOwner = Boolean(address && wallets.some((w) => w.toLowerCase() === address.toLowerCase()));
  const onChain = isConnected && chainId === robinhoodChain.id;

  let blocker: string | null = null;
  if (!isConnected) blocker = "Hubungkan wallet pemilik profil ini untuk tokenize.";
  else if (!onChain) blocker = "Pindah ke Robinhood Chain untuk tokenize.";
  else if (!isOwner) blocker = `Wallet ${shortAddr(address)} bukan milik @${handle}. Hanya pemilik profil yang bisa tokenize.`;

  return (
    <div className="tokenize">
      <div>
        <strong>Tokenize profil ini di Pons</strong>
        <p className="muted">
          Sekali klik: token <b>${symbol}</b> dibuat dari handle, bio, avatar, dan sosial profil ini, lalu diluncurkan di
          Pons V2 (Robinhood Chain, pasangan ETH).
        </p>
        {blocker && <p className="muted small">{blocker}</p>}
        <TokenizeSteps state={tk} withUpload={false} />
        {tk.error && <div className="notice notice-error">{tk.error}</div>}
      </div>
      {!onChain ? (
        <ConnectButton />
      ) : (
        <button
          className="btn btn-primary btn-lg"
          disabled={Boolean(blocker) || tk.busy || !tk.ready}
          onClick={() =>
            tk.tokenize({ creator: address as Address, name: handle, symbol, description: bio, logo: avatar, socials })
          }
        >
          {tk.busy ? "Memproses…" : "Tokenize"}
        </button>
      )}
    </div>
  );
}
