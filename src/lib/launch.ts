import {
  createMetadataBuilder,
  createZoraUploaderForCreator,
  getCreatorCoinPoolConfig,
} from "@zoralabs/coins-sdk";
import { coinFactoryABI, coinFactoryAddress } from "@zoralabs/protocol-deployments";
import { parseEventLogs, toHex, type Address, type Hash, type Hex, type PublicClient, type Transport, type WalletClient } from "viem";
import { base } from "viem/chains";
import { PLATFORM_REFERRER } from "./zora";

const FACTORY = coinFactoryAddress[base.id] as Address;

export type MetadataInput = {
  creator: Address;
  name: string;
  symbol: string;
  description: string;
  image: File | string;
};

/** Uploads the image and coin metadata JSON to IPFS through Zora's uploader (requires an API key). */
export async function uploadMetadata({ creator, name, symbol, description, image }: MetadataInput) {
  const builder = createMetadataBuilder().withName(name).withSymbol(symbol).withDescription(description);
  if (typeof image === "string") builder.withImageURI(image);
  else builder.withImage(image);
  const { url } = await builder.upload(createZoraUploaderForCreator(creator));
  return url.toString();
}

/** Zora's current pool configuration for creator coins (ZORA-paired, multi-curve). */
export async function fetchCreatorPoolConfig(): Promise<Hex> {
  const res = await getCreatorCoinPoolConfig({});
  const encoded = res.data?.creatorCoinPoolConfig?.encodedConfig;
  if (!encoded) throw new Error("Gagal mengambil pool config creator coin dari Zora API.");
  return encoded as Hex;
}

export async function deployCreatorCoin({
  walletClient,
  publicClient,
  account,
  uri,
  name,
  symbol,
  poolConfig,
  onHash,
}: {
  walletClient: WalletClient;
  publicClient: PublicClient<Transport, typeof base>;
  account: Address;
  uri: string;
  name: string;
  symbol: string;
  poolConfig: Hex;
  onHash?: (hash: Hash) => void;
}) {
  const coinSalt = toHex(crypto.getRandomValues(new Uint8Array(32)));
  const { request } = await publicClient.simulateContract({
    address: FACTORY,
    abi: coinFactoryABI,
    functionName: "deployCreatorCoin",
    args: [account, [account], uri, name, symbol, poolConfig, PLATFORM_REFERRER, coinSalt],
    account,
    chain: base,
  });
  const hash = await walletClient.writeContract(request);
  onHash?.(hash);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error("Transaksi gagal (reverted).");
  const [created] = parseEventLogs({ abi: coinFactoryABI, eventName: "CreatorCoinCreated", logs: receipt.logs });
  return { hash, coin: created?.args.coin as Address | undefined };
}
