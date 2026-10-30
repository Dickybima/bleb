import { createZoraUploaderForCreator } from "@zoralabs/coins-sdk";
import {
  concat,
  keccak256,
  parseAbi,
  slice,
  stringToHex,
  parseEventLogs,
  toHex,
  zeroAddress,
  type Address,
  type Hash,
  type Hex,
  type PublicClient,
  type Transport,
  type WalletClient,
} from "viem";
import { robinhoodChain } from "./chains";

import { PONS_FACTORY, PONS_FACTORY_DEPLOY_BLOCK } from "./ponsShared";

/** Pons V2 launch factory on Robinhood Chain (chain id 4663) and its first block. */
export { PONS_FACTORY, PONS_FACTORY_DEPLOY_BLOCK };

/**
 * Launches from this site carry this 6-byte prefix in their CREATE2 salt (the rest is random),
 * so Explore can tell them apart from other Pons launches using only on-chain data.
 */
export const LAUNCHPAD_SALT_TAG = slice(keccak256(stringToHex("profile-launchpad/v1")), 0, 6);
export const isLaunchpadSalt = (salt: Hex) => salt.slice(0, 14).toLowerCase() === LAUNCHPAD_SALT_TAG.toLowerCase();

/** Pair token address meaning "quote in native ETH". */
export const NATIVE_QUOTE: Address = zeroAddress;

const TOKEN_PARAMS =
  "(string name, string symbol, string logo, string description, (string twitter, string telegram, string discord, string website, string farcaster) socials, address creatorFeeRecipient, uint16 creatorTaxBps, bool buybackEnabled, bytes32 expectedEconomics, bytes32 salt)";

export const ponsFactoryAbi = parseAbi([
  "function launchEnabled() view returns (bool)",
  "function canLaunch(address launcher) view returns (bool)",
  "function launchFee() view returns (uint256)",
  "function maxCreatorTaxBps() view returns (uint256)",
  "function launchConfigCount() view returns (uint256)",
  "function getLaunchConfig(uint256 id) view returns ((uint256 supply, uint256 curveFeeBps, uint256 phantomQuote, uint256 graduationThreshold, uint24 poolFee, int24 tickSpacing, bool enabled))",
  "function previewLaunchEconomics(uint256 launchConfigId, address pairToken) view returns (bytes32)",
  "function approvedPairTokens(address pairToken) view returns (bool)",
  `function launchToken(${TOKEN_PARAMS} params, uint256 launchConfigId, address pairToken, address[] snipeTaxExemptions) payable returns (address token, address curve)`,
  `function launchToken(${TOKEN_PARAMS} params, uint256 launchConfigId, address pairToken) payable returns (address token, address curve)`,
  "event TokenLaunched(address indexed token, address indexed curve, address indexed deployer, address pairToken, uint256 launchConfigId, uint256 graduationThreshold)",
]);

// Field byte limits enforced by the factory.
export const LIMITS = { name: 64, symbol: 16, logo: 512, description: 2048, social: 256 };

export type Socials = { twitter: string; telegram: string; discord: string; website: string; farcaster: string };
export const emptySocials = (): Socials => ({ twitter: "", telegram: "", discord: "", website: "", farcaster: "" });

const byteLen = (s: string) => new TextEncoder().encode(s).length;

/** Trims a string to fit a byte limit without splitting multi-byte characters. */
export function fitBytes(s: string, limit: number) {
  let out = s;
  while (byteLen(out) > limit) out = out.slice(0, -1);
  return out;
}

/** Uploads an image file to IPFS through Zora's uploader and returns an https gateway URL usable as a Pons logo. */
export async function uploadLogo(creator: Address, file: File) {
  const { url } = await createZoraUploaderForCreator(creator).upload(file);
  return url.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${url.slice(7)}` : url;
}

type Client = PublicClient<Transport, typeof robinhoodChain>;

/** Picks the configured launch config, or the first enabled one the factory exposes. */
async function resolveLaunchConfigId(publicClient: Client): Promise<bigint> {
  const fromEnv = import.meta.env.VITE_PONS_LAUNCH_CONFIG_ID as string | undefined;
  if (fromEnv) return BigInt(fromEnv);
  const count = await publicClient.readContract({ address: PONS_FACTORY, abi: ponsFactoryAbi, functionName: "launchConfigCount" });
  // IDs may be 0- or 1-based; probe both ends of the range.
  for (let id = 0n; id <= count; id++) {
    try {
      const cfg = await publicClient.readContract({ address: PONS_FACTORY, abi: ponsFactoryAbi, functionName: "getLaunchConfig", args: [id] });
      if (cfg.enabled) return id;
    } catch {
      // nonexistent id
    }
  }
  throw new Error("No active launch configuration right now.");
}

export type LaunchInput = {
  account: Address;
  /** Receives creator fees and creator tax; defaults to the launching account. */
  feeRecipient?: Address;
  name: string;
  symbol: string;
  logo: string;
  description: string;
  socials: Socials;
  creatorTaxBps: number;
  buybackEnabled: boolean;
  /** Quote asset: native ETH (default) or an approved ERC-20 such as a Robinhood stock token. */
  pairToken?: Address;
};

export async function launchOnPons({
  walletClient,
  publicClient,
  input,
  onHash,
}: {
  walletClient: WalletClient;
  publicClient: Client;
  input: LaunchInput;
  onHash?: (hash: Hash) => void;
}) {
  const { account } = input;
  const read = <const F extends "launchEnabled" | "launchFee" | "maxCreatorTaxBps">(functionName: F) =>
    publicClient.readContract({ address: PONS_FACTORY, abi: ponsFactoryAbi, functionName });

  const [enabled, allowed, launchFee, maxTax] = await Promise.all([
    read("launchEnabled"),
    publicClient.readContract({ address: PONS_FACTORY, abi: ponsFactoryAbi, functionName: "canLaunch", args: [account] }),
    read("launchFee"),
    read("maxCreatorTaxBps"),
  ]);
  if (!enabled) throw new Error("Launches are paused right now.");
  if (!allowed) throw new Error("This wallet isn't allowed to launch tokens yet.");
  if (BigInt(input.creatorTaxBps) > maxTax) throw new Error(`Creator tax can be at most ${Number(maxTax) / 100}%.`);

  const pairToken = input.pairToken ?? NATIVE_QUOTE;
  if (pairToken !== NATIVE_QUOTE) {
    const approved = await publicClient.readContract({ address: PONS_FACTORY, abi: ponsFactoryAbi, functionName: "approvedPairTokens", args: [pairToken] });
    if (!approved) throw new Error("This pair asset isn't enabled for launches on Pons yet.");
  }

  const launchConfigId = await resolveLaunchConfigId(publicClient);
  const expectedEconomics = await publicClient.readContract({
    address: PONS_FACTORY,
    abi: ponsFactoryAbi,
    functionName: "previewLaunchEconomics",
    args: [launchConfigId, pairToken],
  });

  const params = {
    name: fitBytes(input.name, LIMITS.name),
    symbol: fitBytes(input.symbol, LIMITS.symbol),
    logo: byteLen(input.logo) <= LIMITS.logo ? input.logo : "",
    description: fitBytes(input.description, LIMITS.description),
    socials: Object.fromEntries(
      Object.entries(input.socials).map(([k, v]) => [k, fitBytes(v, LIMITS.social)]),
    ) as Socials,
    creatorFeeRecipient: input.feeRecipient ?? account,
    creatorTaxBps: input.creatorTaxBps,
    buybackEnabled: input.buybackEnabled,
    expectedEconomics,
    salt: concat([LAUNCHPAD_SALT_TAG, toHex(crypto.getRandomValues(new Uint8Array(26)))]),
  };

  // The factory exposes launchToken with and without snipe-tax exemptions; use whichever simulates.
  const base = { address: PONS_FACTORY, abi: ponsFactoryAbi, functionName: "launchToken", account, value: launchFee, chain: robinhoodChain } as const;
  let request;
  try {
    ({ request } = await publicClient.simulateContract({ ...base, args: [params, launchConfigId, pairToken, []] }));
  } catch (err) {
    try {
      ({ request } = await publicClient.simulateContract({ ...base, args: [params, launchConfigId, pairToken] }));
    } catch {
      throw err;
    }
  }

  const hash = await walletClient.writeContract(request as Parameters<WalletClient["writeContract"]>[0]);
  onHash?.(hash);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error("Transaction reverted.");
  const [launched] = parseEventLogs({ abi: ponsFactoryAbi, eventName: "TokenLaunched", logs: receipt.logs });
  return { hash, token: launched?.args.token, curve: launched?.args.curve };
}
