import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Notice, Skeleton } from "@/components/ui/primitives";
import { useStockPairs, type StockPair } from "../lib/stockPairs";
import { shortAddr } from "../lib/format";

export type PairChoice = { kind: "eth" } | { kind: "stock"; stock: StockPair };

/** Round logo for a stock: the image from Robinhood's asset list when present, otherwise a brand-coloured badge. */
export function StockLogo({ stock, size = 20 }: { stock: StockPair; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (stock.logo && !failed)
    return <img src={stock.logo} alt="" width={size} height={size} onError={() => setFailed(true)} className="shrink-0 rounded-full bg-white object-cover" />;
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold ring-1 ring-black/10 dark:ring-white/15"
      style={{ width: size, height: size, background: stock.color, color: stock.fg ?? "#fff", fontSize: size * (stock.symbol.length > 3 ? 0.36 : 0.42) }}
    >
      {stock.symbol.slice(0, stock.symbol.length > 3 ? 2 : 1)}
    </span>
  );
}

const EthLogo = ({ size = 28 }: { size?: number }) => (
  <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#627eea] font-bold text-white" style={{ width: size, height: size, fontSize: size * 0.5 }}>Ξ</span>
);

const STATUS_HINT: Record<Exclude<StockPair["status"], "ready">, string> = {
  unlisted: "No Robinhood Chain token found for this ticker",
  unapproved: "Not enabled as a pair on Pons yet",
};

/** "Paired asset (quote)": ETH by default, or an approved Robinhood stock token. */
export function PairPicker({ value, onChange, disabled }: { value: PairChoice; onChange: (c: PairChoice) => void; disabled?: boolean }) {
  const stocks = useStockPairs();
  const selected = value.kind === "stock" ? value.stock : null;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange({ kind: "eth" })}
        className={cn(
          "flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition",
          "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900",
          !selected && "ring-2 ring-zinc-900/10 dark:ring-white/10",
        )}
      >
        {selected ? <StockLogo stock={selected} size={28} /> : <EthLogo />}
        <span className="font-semibold">{selected ? selected.symbol : "ETH"}</span>
        <span className="truncate text-sm text-zinc-500 dark:text-zinc-400">{selected ? selected.name : "Ether"}</span>
        {selected?.address && <span className="ml-auto font-mono text-xs text-zinc-400">{shortAddr(selected.address)}</span>}
        {selected && <span className="ml-1 text-xs font-medium text-zinc-500 underline underline-offset-2 dark:text-zinc-400">Use ETH</span>}
      </button>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-zinc-500 dark:text-zinc-400">Pair with a stock:</span>
        {stocks.isPending &&
          Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-7 w-16 rounded-full" />)}
        {(stocks.data ?? []).map((s) => {
          const active = selected?.symbol === s.symbol;
          const usable = s.status === "ready";
          return (
            <button
              key={s.symbol}
              type="button"
              disabled={disabled || !usable}
              title={usable ? `${s.name} · ${s.address}` : `${s.name}: ${STATUS_HINT[s.status as keyof typeof STATUS_HINT]}`}
              onClick={() => onChange(active ? { kind: "eth" } : { kind: "stock", stock: s })}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-full border pl-1 pr-2.5 text-xs font-semibold transition",
                active
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600",
                !usable && "cursor-not-allowed opacity-40 hover:border-zinc-200 dark:hover:border-zinc-800",
              )}
            >
              <StockLogo stock={s} size={20} />
              {s.symbol}
              {active && <Check className="size-3" />}
            </button>
          );
        })}
      </div>

      {stocks.isError && (
        <p className="m-0 text-xs text-zinc-500 dark:text-zinc-400">
          Stock pairs are unavailable right now ({(stocks.error as Error).message}). ETH still works.
        </p>
      )}
      {selected && (
        <Notice>
          Quoted in <b>{selected.symbol}</b>: buyers pay with the {selected.name} stock token. Robinhood Stock Tokens aren't
          available to US, UK, Canadian or Swiss persons.
        </Notice>
      )}
    </div>
  );
}
