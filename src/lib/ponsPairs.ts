import { useQuery } from "@tanstack/react-query";
import { getAddress, type Address } from "viem";
import { STOCKS, matchStockSymbol } from "./stocks";
import { PROXY_HEADER } from "./zoraShared";

/** A pair (quote) asset the Pons factory currently approves. */
export type PonsPair = {
  address: Address;
  symbol: string;
  name?: string;
  logo?: string;
  /** Robinhood Stock Token (restricted for some jurisdictions). */
  stock: boolean;
  /** Badge colours for the fallback logo. */
  color: string;
  fg?: string;
};

/** Stable colour for symbols without a known brand colour. */
function colorFor(symbol: string) {
  let h = 0;
  for (const c of symbol) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h} 55% 42%)`;
}

/** The same pair list Pons offers: every token its factory currently approves (ETH is always available besides). */
export function usePonsPairs() {
  return useQuery({
    queryKey: ["pons-pairs"],
    staleTime: 10 * 60_000,
    retry: 1,
    queryFn: async (): Promise<PonsPair[]> => {
      const res = await fetch("/api/pairs").catch(() => null);
      if (!res?.headers.get(PROXY_HEADER)) throw new Error("the pair list isn't available here");
      if (!res.ok) throw new Error(`couldn't load Pons pairs (HTTP ${res.status})`);
      const body = (await res.json()) as { pairs?: Omit<PonsPair, "color" | "fg">[] };
      return (body.pairs ?? []).map((p) => {
        const brand = STOCKS.find((s) => s.symbol === matchStockSymbol(p.symbol));
        return { ...p, address: getAddress(p.address), color: brand?.color ?? colorFor(p.symbol), fg: brand?.fg };
      });
    },
  });
}
