import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePublicClient, useWalletClient } from "wagmi";
import { base } from "wagmi/chains";
import type { Address, Hash } from "viem";
import { deployCreatorCoin, fetchCreatorPoolConfig, uploadMetadata } from "./launch";
import { hasApiKey } from "./zora";

export type TokenizeStep = "idle" | "upload" | "config" | "sign" | "confirm" | "done";

export const STEP_LABEL: Record<Exclude<TokenizeStep, "idle" | "done">, string> = {
  upload: "Upload metadata ke IPFS",
  config: "Ambil pool config creator coin",
  sign: "Tanda tangani transaksi di wallet",
  confirm: "Menunggu konfirmasi di Base",
};
const ORDER = ["upload", "config", "sign", "confirm"] as const;

export type TokenizeInput = {
  creator: Address;
  name: string;
  symbol: string;
  description: string;
  /** Image file or URL; required when metadata is uploaded via the Zora API. */
  image?: File | string;
  /** Pre-pinned metadata URI, used instead of uploading. */
  metadataUri?: string;
};

/** Fetches a remote image into a File so it gets pinned to IPFS with the metadata; falls back to the URL. */
async function toUploadableImage(image: File | string): Promise<File | string> {
  if (typeof image !== "string") return image;
  try {
    const res = await fetch(image);
    const blob = await res.blob();
    if (!res.ok || !blob.type.startsWith("image/")) return image;
    return new File([blob], `avatar.${blob.type.split("/")[1] ?? "png"}`, { type: blob.type });
  } catch {
    return image;
  }
}

export function useTokenize() {
  const queryClient = useQueryClient();
  const publicClient = usePublicClient({ chainId: base.id });
  const { data: walletClient } = useWalletClient({ chainId: base.id });

  const [step, setStep] = useState<TokenizeStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [coin, setCoin] = useState<Address | null>(null);

  const ready = Boolean(walletClient && publicClient);
  const busy = step !== "idle" && step !== "done";

  const tokenize = async ({ creator, name, symbol, description, image, metadataUri }: TokenizeInput) => {
    if (!walletClient || !publicClient) return;
    setError(null);
    setTxHash(null);
    try {
      let uri = metadataUri?.trim() ?? "";
      if (!uri) {
        if (!hasApiKey) throw new Error("VITE_ZORA_API_KEY belum di-set, metadata tidak bisa di-upload otomatis.");
        if (!image) throw new Error("Gambar coin wajib diisi.");
        setStep("upload");
        uri = await uploadMetadata({ creator, name, symbol, description, image: await toUploadableImage(image) });
      }
      setStep("config");
      const poolConfig = await fetchCreatorPoolConfig();
      setStep("sign");
      const result = await deployCreatorCoin({
        walletClient,
        publicClient,
        account: creator,
        uri,
        name,
        symbol,
        poolConfig,
        onHash: (h) => {
          setTxHash(h);
          setStep("confirm");
        },
      });
      setCoin(result.coin ?? null);
      setStep("done");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (err) {
      const e = err as { shortMessage?: string; message?: string };
      setError(e.shortMessage ?? e.message ?? String(err));
      setStep("idle");
    }
  };

  const stepState = (s: (typeof ORDER)[number]) =>
    ORDER.indexOf(s) < ORDER.indexOf(step as (typeof ORDER)[number]) ? "done" : s === step ? "active" : "";

  return { tokenize, step, busy, ready, error, txHash, coin, stepState };
}
