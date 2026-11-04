import { setApiKey } from "@zoralabs/coins-sdk";
import { isAddress } from "viem";
import { appChain } from "./chains";

const apiKey = import.meta.env.VITE_ZORA_API_KEY as string | undefined;
if (apiKey) setApiKey(apiKey);

/** The Zora API key is only needed to upload custom logo images to IPFS. */
export const hasApiKey = Boolean(apiKey);

export const zoraProfileUrl = (handleOrAddress: string) =>
  isAddress(handleOrAddress)
    ? `https://zora.co/${handleOrAddress}`
    : `https://zora.co/@${handleOrAddress}`;


const explorer = appChain.blockExplorers.default.url;
export const explorerTxUrl = (hash: string) => `${explorer}/tx/${hash}`;
export const explorerTokenUrl = (address: string) => `${explorer}/token/${address}`;
export const explorerAddressUrl = (address: string) => `${explorer}/address/${address}`;
