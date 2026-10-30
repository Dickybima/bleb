import { defineChain } from "viem";
import { DEFAULT_ROBINHOOD_RPC } from "./ponsShared";

const rpcUrl = (import.meta.env.VITE_ROBINHOOD_RPC_URL as string | undefined) || DEFAULT_ROBINHOOD_RPC;

export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
  blockExplorers: { default: { name: "Blockscout", url: "https://robinhoodchain.blockscout.com" } },
});
