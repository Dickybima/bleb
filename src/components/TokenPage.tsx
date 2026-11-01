import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, BadgeCheck, Check, Copy } from "lucide-react";
import { ColorType, createChart, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import type { Address } from "viem";
import { cn } from "@/lib/utils";
import { Notice, Panel, Skeleton, ghostButtonClass, linkButtonClass } from "@/components/ui/primitives";
import { Avatar } from "./Avatar";
import { ZeonMark } from "./ZeonLogo";
import type { LaunchedToken } from "../lib/explore";
import { fmtNum, shortAddr, timeAgo } from "../lib/format";
import { OFFICIAL_TOKEN } from "../lib/site";
import { useTheme } from "../lib/theme";
import { toCandles, useEthUsd, useTokenInfo, useTrades, type Trade } from "../lib/tokenMarket";
import { explorerAddressUrl, explorerTokenUrl, explorerTxUrl } from "../lib/zora";

const INTERVALS = [
  ["1m", 60],
  ["5m", 300],
  ["15m", 900],
  ["1h", 3600],
  ["4h", 14400],
  ["1D", 86400],
] as const;

/** Small prices with a subscript zero count, e.g. 0.0₅4213. */
function fmtPrice(v?: number, prefix = "") {
  if (v === undefined || !Number.isFinite(v)) return "–";
  if (v === 0) return `${prefix}0`;
  if (v >= 1) return `${prefix}${v.toLocaleString("en-US", { maximumFractionDigits: v >= 1000 ? 0 : 4 })}`;
  const zeros = Math.floor(-Math.log10(v));
  const digits = (v * 10 ** (zeros + 4)).toFixed(0).slice(0, 4);
  if (zeros < 4) return `${prefix}${v.toPrecision(4).replace(/0+$/, "")}`;
  const sub = String(zeros).split("").map((d) => "₀₁₂₃₄₅₆₇₈₉"[Number(d)]).join("");
  return `${prefix}0.0${sub}${digits}`;
}

const fmtValue = (v: number | undefined, usd: boolean) =>
  v === undefined || !Number.isFinite(v) ? "–" : usd ? `$${fmtNum(v)}` : `${fmtNum(v)} ETH`;

export function TokenPage({ address }: { address: string }) {
  const token = address as Address;
  const official = token.toLowerCase() === OFFICIAL_TOKEN;
  const info = useTokenInfo(token);
  const ethUsd = useEthUsd().data ?? undefined;
  const trades = useTrades(token, info.data?.curve, info.data?.decimals);
  const all = useMemo(() => {
    const seen = new Set<string>();
    return (trades.data?.pages.flatMap((p) => p.trades) ?? []).filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)));
  }, [trades.data]);

  // Logo and description from Explore's data when we came from there.
  const queryClient = useQueryClient();
  const listed = useMemo(() => {
    const data = queryClient.getQueryData<InfiniteData<{ items: LaunchedToken[] }>>(["explore-pons"]);
    return data?.pages.flatMap((p) => p.items).find((t) => t.token.toLowerCase() === token.toLowerCase());
  }, [queryClient, token]);

  const d = info.data;
  const usd = ethUsd !== undefined;
  const k = usd ? ethUsd! : 1;
  const lastPrice = d?.spotEth ?? all[0]?.priceEth;
  const price = lastPrice !== undefined ? lastPrice * k : undefined;
  const mcap = price !== undefined && d?.totalSupply ? price * d.totalSupply : undefined;

  const now = Date.now() / 1000;
  const day = all.filter((t) => t.timestamp !== undefined && t.timestamp >= now - 86400);
  const volume = day.reduce((s, t) => s + t.eth, 0) * k;
  const dayOpen = all.find((t) => t.timestamp !== undefined && t.timestamp < now - 86400)?.priceEth ?? day[day.length - 1]?.priceEth;
  const change = dayOpen && lastPrice ? (lastPrice / dayOpen - 1) * 100 : undefined;

  const name = d?.name || listed?.name || (official ? "ZEON" : "");
  const symbol = (d?.symbol || listed?.symbol || (official ? "ZEON" : "")).toUpperCase();

  return (
    <section className="flex flex-col gap-6">
      <a href="#/explore" className="inline-flex w-fit items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
        <ArrowLeft className="size-4" /> Explore
      </a>

      <Header token={token} name={name} symbol={symbol} official={official} logo={listed?.logo} loading={info.isPending} />

      {info.isError && <Notice tone="error">Couldn't reach Robinhood Chain: {(info.error as Error).message}</Notice>}
      {d && !d.curve && <Notice>This token wasn't launched through Pons V2, so there's no curve data to chart.</Notice>}
      {d && (d.phase === "pool" || d.phase === "swept") && (
        <Notice>Graduated to Uniswap v4. The chart and trades below cover the bonding-curve period; newer pool trades aren't shown yet.</Notice>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 [&>*]:min-w-0">
        <Stat label="Price" value={fmtPrice(price, usd ? "$" : "")} sub={usd ? undefined : "ETH"} loading={info.isPending} />
        <Stat label="Market cap" value={fmtValue(mcap, usd)} loading={info.isPending} />
        <Stat label="24h volume" value={fmtValue(volume, usd)} loading={trades.isPending} />
        <Stat
          label="24h change"
          value={change === undefined ? "–" : `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`}
          tone={change === undefined ? undefined : change >= 0 ? "up" : "down"}
          loading={trades.isPending}
        />
        <Stat className="col-span-2 md:col-span-1" label="Trades" value={trades.hasNextPage ? `${all.length}+` : String(all.length)} loading={trades.isPending} />
      </div>

      {d?.progress !== undefined && (
        <Panel className="flex flex-col gap-2 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Bonding curve</span>
            <span className="font-mono font-semibold">{d.phase === "curve" ? `${(d.progress * 100).toFixed(1)}%` : "Graduated"}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#b6ff1f,#39ff8f_50%,#2fb8ff)]" style={{ width: `${Math.max(2, d.progress * 100)}%` }} />
          </div>
        </Panel>
      )}

      <PriceChart trades={all} supply={d?.totalSupply ?? 0} ethUsd={ethUsd} loading={trades.isPending || (trades.isFetching && all.length === 0)} />

      <Trades trades={all} usd={ethUsd} symbol={symbol} loading={trades.isPending} error={trades.error as Error | null} scanning={trades.isFetchingNextPage} more={trades.hasNextPage} onMore={() => trades.fetchNextPage()} />
    </section>
  );
}

function Header({ token, name, symbol, official, logo, loading }: { token: Address; name: string; symbol: string; official: boolean; logo?: string; loading: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () =>
    navigator.clipboard?.writeText(token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {official ? (
          <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-2xl bg-black ring-1 ring-emerald-500/30">
            <ZeonMark size={52} />
          </span>
        ) : (
          <Avatar src={logo} name={symbol || "?"} size={64} className="rounded-2xl" />
        )}
        <div className="min-w-0">
          {loading && !name ? (
            <Skeleton className="h-7 w-40" />
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{name || shortAddr(token)}</h1>
              {official && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <BadgeCheck className="size-3.5" /> Official
                </span>
              )}
            </div>
          )}
          {symbol && <span className="font-mono text-sm text-zinc-500 dark:text-zinc-400">${symbol}</span>}
          <button onClick={copy} title="Copy contract address" className="mt-1 flex max-w-full items-center gap-1.5 font-mono text-xs text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
            <span className="truncate">{token}</span>
            {copied ? <Check className="size-3.5 shrink-0 text-emerald-500" /> : <Copy className="size-3.5 shrink-0" />}
          </button>
        </div>
      </div>
      <a className={`${ghostButtonClass} shrink-0`} href={explorerTokenUrl(token)} target="_blank" rel="noreferrer">
        Explorer <ArrowUpRight className="size-4" />
      </a>
    </div>
  );
}

function Stat({ label, value, sub, tone, loading, className }: { label: string; value: string; sub?: string; tone?: "up" | "down"; loading?: boolean; className?: string }) {
  return (
    <Panel className={cn("flex flex-col gap-1 p-4", className)}>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      {loading ? (
        <Skeleton className="h-6 w-20" />
      ) : (
        <span className={cn("truncate font-mono text-lg font-semibold", tone === "up" && "text-emerald-500", tone === "down" && "text-rose-500")}>
          {value}
          {sub && <span className="ml-1 text-xs font-normal text-zinc-500">{sub}</span>}
        </span>
      )}
    </Panel>
  );
}

function PriceChart({ trades, supply, ethUsd, loading }: { trades: Trade[]; supply: number; ethUsd?: number; loading: boolean }) {
  const [mode, setMode] = useState<"price" | "mcap">("mcap");
  const [interval, setInterval] = useState<number>(300);
  const { theme } = useTheme();
  const box = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const series = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const usd = ethUsd !== undefined;
  const k = usd ? ethUsd! : 1;

  const candles = useMemo(
    () => toCandles(trades, interval, (t) => t.priceEth * k * (mode === "mcap" ? supply || 1 : 1)),
    [trades, interval, k, mode, supply],
  );

  useEffect(() => {
    if (!box.current) return;
    const c = createChart(box.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, fontFamily: "JetBrains Mono, monospace", fontSize: 11 },
      timeScale: { timeVisible: true, secondsVisible: false, borderVisible: false },
      rightPriceScale: { borderVisible: false },
      crosshair: { mode: 0 },
    });
    series.current = c.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#f43f5e",
      wickUpColor: "#22c55e",
      wickDownColor: "#f43f5e",
      borderVisible: false,
    });
    chart.current = c;
    return () => {
      c.remove();
      chart.current = null;
      series.current = null;
    };
  }, []);

  useEffect(() => {
    const dark = theme === "dark";
    chart.current?.applyOptions({
      layout: { textColor: dark ? "#a1a1aa" : "#52525b" },
      grid: { vertLines: { color: dark ? "#18181b" : "#f4f4f5" }, horzLines: { color: dark ? "#18181b" : "#f4f4f5" } },
    });
  }, [theme]);

  useEffect(() => {
    const prefix = usd ? "$" : "";
    series.current?.applyOptions({
      priceFormat: { type: "custom", minMove: 1e-12, formatter: (v: number) => (mode === "mcap" ? `${prefix}${fmtNum(v)}` : fmtPrice(v, prefix)) },
    });
    series.current?.setData(candles.map((c) => ({ ...c, time: c.time as UTCTimestamp })));
    chart.current?.timeScale().fitContent();
  }, [candles, mode, usd]);

  return (
    <Panel className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segment value={mode} onChange={setMode} options={[["mcap", "Market cap"], ["price", "Price"]]} />
        <Segment value={interval} onChange={setInterval} options={INTERVALS.map(([l, s]) => [s, l] as const)} />
      </div>
      <div className="relative h-[340px] sm:h-[420px]">
        <div ref={box} className="absolute inset-0" />
        {(loading || candles.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
            {loading ? "Loading trades from Robinhood Chain…" : "No trades yet."}
          </div>
        )}
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {mode === "mcap" ? "Market cap" : "Price"} in {usd ? "USD" : "ETH"} from bonding-curve trades{usd ? " (ETH/USD via CoinGecko)" : ""}.
      </p>
    </Panel>
  );
}

function Segment<T extends string | number>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: readonly (readonly [T, string])[] }) {
  return (
    <div className="inline-flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/80">
      {options.map(([v, label]) => (
        <button
          key={String(v)}
          onClick={() => onChange(v)}
          className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-semibold transition sm:px-3",
            v === value ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Trades({ trades, usd, symbol, loading, error, scanning, more, onMore }: {
  trades: Trade[];
  usd?: number;
  symbol: string;
  loading: boolean;
  error: Error | null;
  scanning: boolean;
  more?: boolean;
  onMore: () => void;
}) {
  const [shown, setShown] = useState(25);
  const rows = trades.slice(0, shown);
  return (
    <Panel className="p-4">
      <h2 className="mb-3 text-lg font-bold tracking-tight">Transactions</h2>
      {error && <Notice tone="error">Couldn't load trades: {error.message}</Notice>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-500 dark:text-zinc-400">
              <th className="py-2 pr-3 font-medium">Type</th>
              <th className="py-2 pr-3 text-right font-medium">{usd ? "USD" : "ETH"}</th>
              <th className="py-2 pr-3 text-right font-medium">{symbol ? `$${symbol}` : "Tokens"}</th>
              <th className="py-2 pr-3 font-medium">Account</th>
              <th className="py-2 text-right font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 5 }, (_, i) => (
              <tr key={i}><td colSpan={5} className="py-2"><Skeleton className="h-6 w-full" /></td></tr>
            ))}
            {rows.map((t) => (
              <tr key={t.id} className="border-t border-zinc-100 dark:border-zinc-800/80">
                <td className={cn("py-2.5 pr-3 font-semibold", t.kind === "buy" ? "text-emerald-500" : "text-rose-500")}>{t.kind === "buy" ? "Buy" : "Sell"}</td>
                <td className="py-2.5 pr-3 text-right font-mono">{usd ? `$${(t.eth * usd).toLocaleString("en-US", { maximumFractionDigits: 2 })}` : t.eth.toPrecision(4)}</td>
                <td className="py-2.5 pr-3 text-right font-mono">{fmtNum(t.tokens)}</td>
                <td className="py-2.5 pr-3 font-mono">
                  <a className="hover:underline" href={explorerAddressUrl(t.account)} target="_blank" rel="noreferrer">{shortAddr(t.account)}</a>
                </td>
                <td className="py-2.5 text-right font-mono text-zinc-500 dark:text-zinc-400">
                  <a className="hover:underline" href={explorerTxUrl(t.txHash)} target="_blank" rel="noreferrer">{timeAgo(t.timestamp) || `#${t.blockNumber}`}</a>
                </td>
              </tr>
            ))}
            {!loading && trades.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-zinc-500">{scanning || more ? "Scanning older blocks…" : "No trades yet."}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        {shown < trades.length && <button className={ghostButtonClass} onClick={() => setShown((n) => n + 25)}>Show more</button>}
        {shown >= trades.length && more && (
          <button className={linkButtonClass} onClick={onMore} disabled={scanning}>{scanning ? "Scanning older blocks…" : "Load older trades"}</button>
        )}
      </div>
    </Panel>
  );
}
