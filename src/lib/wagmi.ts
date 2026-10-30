import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { coinbaseWallet, injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [injected(), coinbaseWallet({ appName: "Zora Profile Launchpad" })],
  transports: { [base.id]: http() },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
