import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePublicClient, useWalletClient } from "wagmi";
import type { Address, Hash } from "viem";
import { robinhoodChain } from "./chains";
import { launchOnPons, uploadLogo, type Socials } from "./pons";

export type TokenizeStep = "idle" | "upload" | "sign" | "confirm" | "done";

export const STEP_LABEL: Record<Exclude<TokenizeStep, "idle" | "done">, string> = {
  upload: "Upload logo ke IPFS",
  sign: "Cek kontrak & tanda tangani transaksi",
  confirm: "Menunggu konfirmasi di Robinhood Chain",
};
const ORDER = ["upload", "sign", "confirm"] as const;

export type TokenizeInput = {
  creator: Address;
  feeRecipient?: Address;
  name: string;
  symbol: string;
  description: string;
  /** Logo as an uploaded file (pinned to IPFS first) or an existing image URL. */
  logo?: File | string;
  socials: Socials;
  creatorTaxBps?: number;
  buybackEnabled?: boolean;
};

export function useTokenize() {
  const queryClient = useQueryClient();
  const publicClient = usePublicClient({ chainId: robinhoodChain.id });
  const { data: walletClient } = useWalletClient({ chainId: robinhoodChain.id });

  const [step, setStep] = useState<TokenizeStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [token, setToken] = useState<Address | null>(null);

  const ready = Boolean(walletClient && publicClient);
  const busy = step !== "idle" && step !== "done";

  const tokenize = async (input: TokenizeInput) => {
    if (!walletClient || !publicClient) return;
    setError(null);
    setTxHash(null);
    try {
      let logo = typeof input.logo === "string" ? input.logo : "";
      if (input.logo instanceof File) {
        setStep("upload");
        logo = await uploadLogo(input.creator, input.logo);
      }
      setStep("sign");
      const result = await launchOnPons({
        walletClient,
        publicClient,
        input: {
          account: input.creator,
          feeRecipient: input.feeRecipient,
          name: input.name,
          symbol: input.symbol,
          logo,
          description: input.description,
          socials: input.socials,
          creatorTaxBps: input.creatorTaxBps ?? 0,
          buybackEnabled: input.buybackEnabled ?? false,
        },
        onHash: (h) => {
          setTxHash(h);
          setStep("confirm");
        },
      });
      setToken(result.token ?? null);
      setStep("done");
      // Make the new launch show up in Explore right away.
      queryClient.invalidateQueries({ queryKey: ["explore-pons"] });
    } catch (err) {
      const e = err as { shortMessage?: string; message?: string };
      setError(e.shortMessage ?? e.message ?? String(err));
      setStep("idle");
    }
  };

  const stepState = (s: (typeof ORDER)[number]) =>
    ORDER.indexOf(s) < ORDER.indexOf(step as (typeof ORDER)[number]) ? "done" : s === step ? "active" : "";

  return { tokenize, step, busy, ready, error, txHash, token, stepState };
}
