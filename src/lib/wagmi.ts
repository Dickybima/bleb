import { createConfig, http } from "wagmi";
import { coinbaseWallet, injected } from "wagmi/connectors";
import { robinhoodChain } from "./chains";

export const wagmiConfig = createConfig({
  chains: [robinhoodChain],
  connectors: [injected(), coinbaseWallet({ appName: "Profile Launchpad" })],
  transports: { [robinhoodChain.id]: http() },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
