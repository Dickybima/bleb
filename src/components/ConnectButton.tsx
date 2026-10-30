import { ConnectButton as RKConnectButton } from "@rainbow-me/rainbowkit";
import { shortAddr } from "../lib/format";

/** Wallet button: opens the multi-wallet picker, prompts a network switch, or shows the connected account. */
export function ConnectButton() {
  return (
    <RKConnectButton.Custom>
      {({ account, chain, mounted, openConnectModal, openChainModal, openAccountModal }) => {
        if (!mounted) return <button className="btn btn-primary" disabled aria-hidden>Connect Wallet</button>;
        if (!account) {
          return (
            <button className="btn btn-primary" onClick={openConnectModal}>
              Connect<span className="hide-xs"> Wallet</span>
            </button>
          );
        }
        if (chain?.unsupported) {
          return (
            <button className="btn btn-warn" onClick={openChainModal}>
              Pindah<span className="hide-xs"> ke Robinhood Chain</span>
            </button>
          );
        }
        return (
          <button className="btn btn-ghost" onClick={openAccountModal}>
            {account.ensName ?? shortAddr(account.address)}
          </button>
        );
      }}
    </RKConnectButton.Custom>
  );
}
