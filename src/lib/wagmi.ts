import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  binanceWallet,
  bitgetWallet,
  braveWallet,
  coinbaseWallet,
  injectedWallet,
  ledgerWallet,
  metaMaskWallet,
  okxWallet,
  phantomWallet,
  rabbyWallet,
  rainbowWallet,
  safeWallet,
  trustWallet,
  uniswapWallet,
  walletConnectWallet,
  zerionWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { robinhoodChain } from "./chains";

const APP_NAME = "ZEON";

/** Reown (WalletConnect) project ID; needed for QR / mobile wallet connections. Free at cloud.reown.com. */
export const walletConnectProjectId = (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) ?? "";
if (!walletConnectProjectId) {
  console.warn("VITE_WALLETCONNECT_PROJECT_ID is not set: QR / WalletConnect wallets won't be able to connect.");
}

const connectors = connectorsForWallets(
  [
    {
      groupName: "Populer",
      wallets: [metaMaskWallet, coinbaseWallet, rabbyWallet, okxWallet, trustWallet, rainbowWallet, walletConnectWallet],
    },
    {
      groupName: "Lainnya",
      wallets: [
        phantomWallet,
        bitgetWallet,
        binanceWallet,
        uniswapWallet,
        zerionWallet,
        braveWallet,
        ledgerWallet,
        safeWallet,
        injectedWallet,
      ],
    },
  ],
  { appName: APP_NAME, projectId: walletConnectProjectId || "missing-project-id" },
);

export const wagmiConfig = createConfig({
  connectors,
  chains: [robinhoodChain],
  transports: { [robinhoodChain.id]: http() },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
