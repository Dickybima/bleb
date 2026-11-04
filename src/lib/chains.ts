import { defineChain } from "viem";

const rpcUrl = (import.meta.env.VITE_ELYSIUM_RPC_URL as string | undefined) || "https://testnet-rpc.elysium.kinetiq.xyz";

/**
 * Elysium Testnet (Kinetiq's chain on HyperEVM), gas paid in HYPE. Elysium mainnet details aren't published yet;
 * when they are, update id, RPC and explorer here.
 */
export const appChain = defineChain({
  id: 99801,
  name: "Elysium Testnet",
  nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
  blockExplorers: { default: { name: "Elysium Explorer", url: "https://explorer-elysium-testnet.t.conduit.xyz" } },
  testnet: true,
});
