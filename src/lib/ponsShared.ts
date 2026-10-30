import { parseAbi, type Address } from "viem";

/** Pons V2 constants with no browser-only imports, so the /api routes can use them too. */
export const PONS_FACTORY: Address = "0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e";
/** First block of the Pons V2 factory on Robinhood Chain. */
export const PONS_FACTORY_DEPLOY_BLOCK = 57_412_596n;
export const DEFAULT_ROBINHOOD_RPC = "https://rpc.mainnet.chain.robinhood.com";

export const pairApprovalAbi = parseAbi([
  "event PairTokenApprovalUpdated(address indexed pairToken, bool approved)",
  "function approvedPairTokens(address pairToken) view returns (bool)",
]);
