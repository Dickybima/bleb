import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Notice, Skeleton } from "@/components/ui/primitives";
import { usePonsPairs, type PonsPair } from "../lib/ponsPairs";
import { shortAddr } from "../lib/format";

export type PairChoice = { kind: "eth" } | { kind: "token"; pair: PonsPair };

/** Round logo for a pair token: Robinhood's image when known, otherwise a coloured symbol badge. */
export function PairLogo({ pair, size = 20 }: { pair: PonsPair; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (pair.logo && !failed)
    return <img src={pair.logo} alt="" width={size} height={size} onError={() => setFailed(true)} className="shrink-0 rounded-full bg-white object-cover" />;
  const label = pair.symbol.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold ring-1 ring-black/10 dark:ring-white/15"
      style={{ width: size, height: size, background: pair.color, color: pair.fg ?? "#fff", fontSize: size * (label.length > 3 ? 0.36 : 0.42) }}
    >
      {label.slice(0, label.length > 3 ? 2 : 1)}
    </span>
  );
}

const EthLogo = ({ size = 28 }: { size?: number }) => (
  <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#627eea] font-bold text-white" style={{ width: size, height: size, fontSize: size * 0.5 }}>Ξ</span>
);

/** "Paired asset (quote)": the same choices Pons offers: ETH, or any pair token its factory currently approves. */
export function PairPicker({ value, onChange, disabled }: { value: PairChoice; onChange: (c: PairChoice) => void; disabled?: boolean }) {
  const pairs = usePonsPairs();
  const selected = value.kind === "token" ? value.pair : null;
  const list = pairs.data ?? [];

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange({ kind: "eth" })}
        className={cn(
          "flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-left transition dark:border-zinc-800 dark:bg-zinc-900",
          !selected && "ring-2 ring-zinc-900/10 dark:ring-white/10",
        )}
      >
        {selected ? <PairLogo pair={selected} size={28} /> : <EthLogo />}
        <span className="font-semibold">{selected ? selected.symbol : "ETH"}</span>
        <span className="truncate text-sm text-zinc-500 dark:text-zinc-400">{selected ? selected.name : "Ether"}</span>
        {selected && <span className="ml-auto font-mono text-xs text-zinc-400">{shortAddr(selected.address)}</span>}
        {selected && <span className="ml-1 text-xs font-medium text-zinc-500 underline underline-offset-2 dark:text-zinc-400">Use ETH</span>}
      </button>

      {(pairs.isPending || list.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-zinc-500 dark:text-zinc-400">Or pair with:</span>
          {pairs.isPending && Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-7 w-16 rounded-full" />)}
          {list.map((p) => {
            const active = selected?.address === p.address;
            return (
              <button
                key={p.address}
                type="button"
                disabled={disabled}
                title={`${p.name ?? p.symbol} · ${p.address}`}
                onClick={() => onChange(active ? { kind: "eth" } : { kind: "token", pair: p })}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-full border pl-1 pr-2.5 text-xs font-semibold transition",
                  active
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600",
                )}
              >
                <PairLogo pair={p} size={20} />
                {p.symbol}
                {active && <Check className="size-3" />}
              </button>
            );
          })}
        </div>
      )}

      {pairs.isSuccess && list.length === 0 && (
        <p className="m-0 text-xs text-zinc-500 dark:text-zinc-400">Pons currently offers ETH only. New pairs show up here as soon as Pons approves them.</p>
      )}
      {pairs.isError && (
        <p className="m-0 text-xs text-zinc-500 dark:text-zinc-400">Other pairs are unavailable right now ({(pairs.error as Error).message}). ETH still works.</p>
      )}
      {selected && (
        <Notice>
          Quoted in <b>{selected.symbol}</b>: buyers pay with {selected.name ?? selected.symbol}.
          {selected.stock && " Robinhood Stock Tokens aren't available to US, UK, Canadian or Swiss persons."}
        </Notice>
      )}
    </div>
  );
}
