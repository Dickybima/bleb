import { setApiKey } from "@zoralabs/coins-sdk";
import { getAddress, isAddress, zeroAddress, type Address } from "viem";

const apiKey = import.meta.env.VITE_ZORA_API_KEY as string | undefined;
if (apiKey) setApiKey(apiKey);

export const hasApiKey = Boolean(apiKey);

const referrer = import.meta.env.VITE_PLATFORM_REFERRER as string | undefined;
export const PLATFORM_REFERRER: Address =
  referrer && isAddress(referrer) ? getAddress(referrer) : zeroAddress;

export const zoraProfileUrl = (handleOrAddress: string) =>
  isAddress(handleOrAddress)
    ? `https://zora.co/${handleOrAddress}`
    : `https://zora.co/@${handleOrAddress}`;

export const zoraCoinUrl = (address: string) => `https://zora.co/coin/base:${address}`;
export const basescanTxUrl = (hash: string) => `https://basescan.org/tx/${hash}`;
