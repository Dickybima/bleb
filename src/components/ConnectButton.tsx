import { ConnectButton as RKConnectButton } from "@rainbow-me/rainbowkit";
import { OrbButton } from "@/components/ui/hero-with-cards-utils/orb-button";
import { shortAddr } from "../lib/format";

/** Wallet button: opens the multi-wallet picker, prompts a network switch, or shows the connected account. */
export function ConnectButton() {
  return (
    <RKConnectButton.Custom>
      {({ account, chain, mounted, openConnectModal, openChainModal, openAccountModal }) => {
        if (!mounted) return <OrbButton size="sm" disabled aria-hidden>Connect Wallet</OrbButton>;
        if (!account) {
          return (
            <OrbButton size="sm" onClick={openConnectModal}>
              Connect<span className="max-sm:hidden"> Wallet</span>
            </OrbButton>
          );
        }
        if (chain?.unsupported) {
          return (
            <OrbButton size="sm" variant="warn" noOrb onClick={openChainModal}>
              Switch<span className="max-sm:hidden"> to Robinhood Chain</span>
            </OrbButton>
          );
        }
        return (
          <button
            onClick={openAccountModal}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 font-mono text-[13px] font-semibold text-zinc-900 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" aria-hidden />
            {account.ensName ?? shortAddr(account.address)}
          </button>
        );
      }}
    </RKConnectButton.Custom>
  );
}
