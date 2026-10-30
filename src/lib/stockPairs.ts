import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { getAddress, type Address } from "viem";
import { robinhoodChain } from "./chains";
import { PONS_FACTORY, ponsFactoryAbi } from "./pons";
import { STOCKS, type ResolvedStock, type StockMeta } from "./stocks";
import { PROXY_HEADER } from "./zoraShared";

export type StockPair = StockMeta & {
  address?: Address;
  logo?: string;
  /** ready: selectable · unlisted: not among the Pons factory's approved pairs · unapproved: approval was revoked since. */
  status: "ready" | "unlisted" | "unapproved";
};

async function fetchResolved(): Promise<ResolvedStock[]> {
  const res = await fetch("/api/stock-tokens").catch(() => null);
  if (!res?.headers.get(PROXY_HEADER)) throw new Error("Stock token list isn't available here.");
  if (!res.ok) throw new Error(`Couldn't load stock tokens (HTTP ${res.status}).`);
  const body = (await res.json()) as { tokens?: ResolvedStock[] };
  return body.tokens ?? [];
}

/** The stock pair list with each token's on-chain approval status on the Pons factory. */
export function useStockPairs() {
  const client = usePublicClient({ chainId: robinhoodChain.id });
  return useQuery({
    queryKey: ["stock-pairs"],
    enabled: Boolean(client),
    staleTime: 10 * 60_000,
    retry: 1,
    queryFn: async (): Promise<StockPair[]> => {
      const resolved = new Map((await fetchResolved()).map((t) => [t.symbol, t]));
      return Promise.all(
        STOCKS.map(async (meta): Promise<StockPair> => {
          const r = resolved.get(meta.symbol);
          if (!r) return { ...meta, status: "unlisted" };
          const address = getAddress(r.address);
          // Live re-check; if the browser's RPC call fails, keep the server's (already on-chain) answer.
          const approved = await client!
            .readContract({ address: PONS_FACTORY, abi: ponsFactoryAbi, functionName: "approvedPairTokens", args: [address] })
            .catch(() => true);
          return { ...meta, address, logo: r.logo, status: approved ? "ready" : "unapproved" };
        }),
      );
    },
  });
}
