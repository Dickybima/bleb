import { useState } from "react";
import { motion } from "motion/react";
import { ArrowUpRight, BadgeCheck, Check, Copy } from "lucide-react";
import { erc20Abi } from "viem";
import { useReadContracts } from "wagmi";
import { Avatar } from "./Avatar";
import { OrbButton } from "@/components/ui/hero-with-cards-utils/orb-button";
import { Notice, Reveal, Skeleton, ghostButtonClass, linkButtonClass } from "@/components/ui/primitives";
import { ZeonMark } from "./ZeonLogo";
import { robinhoodChain } from "../lib/chains";
import { useExplore, type LaunchedToken } from "../lib/explore";
import { OFFICIAL_TOKEN } from "../lib/site";
import { shortAddr, timeAgo } from "../lib/format";
import { explorerAddressUrl, explorerTokenUrl, explorerTxUrl } from "../lib/zora";

export function Explore() {
  const query = useExplore();
  // The official token has its own card above the grid.
  const tokens = (query.data?.pages.flatMap((p) => p.items) ?? []).filter((t) => t.token.toLowerCase() !== OFFICIAL_TOKEN);

  return (
    <section className="flex flex-col gap-6">
      <Reveal className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 md:text-6xl dark:text-white">
          <em className="font-extrabold italic text-zinc-600 dark:text-zinc-300">Explore</em>
        </h1>
        <p className="mt-3 text-zinc-500 dark:text-zinc-400">
          Fresh tokens minted on ZEON, newest first.
          {query.isFetching && !query.isPending && <span className="text-emerald-500"> · refreshing…</span>}
        </p>
      </Reveal>

      <OfficialTokenCard />

      {query.isError && (
        <Notice tone="error">
          Couldn't reach Robinhood Chain: {(query.error as Error).message}{" "}
          <button className={linkButtonClass} onClick={() => query.refetch()}>Retry</button>
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {query.isPending && Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        {tokens.map((t, i) => <TokenCard key={t.token} token={t} index={i} />)}
      </div>

      {!query.isPending && !query.isError && tokens.length === 0 && (
        <Reveal className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-zinc-300 px-6 py-14 text-center dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            {query.hasNextPage ? "Nothing in the latest blocks yet." : "No tokens yet. The first one is still up for grabs."}
          </p>
          <OrbButton href="#/top">Tokenize the first profile</OrbButton>
        </Reveal>
      )}

      {query.hasNextPage && (
        <button className={`${ghostButtonClass} mx-auto`} onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
          {query.isFetchingNextPage ? "Scanning older blocks…" : "Load more"}
        </button>
      )}
    </section>
  );
}

function TokenCard({ token: t, index }: { token: LaunchedToken; index: number }) {
  const symbol = t.symbol || "???";
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index, 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="flex min-w-0 flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm ring-1 ring-transparent transition-shadow hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      <div className="flex items-center gap-3">
        <Avatar src={t.logo} name={symbol} size={52} className="rounded-xl" />
        <div className="flex min-w-0 flex-1 flex-col">
          <strong className="truncate font-semibold">{t.name || symbol}</strong>
          <span className="font-mono text-[13px] text-zinc-500 dark:text-zinc-400">${symbol.toUpperCase()}</span>
        </div>
      </div>
      {t.description && <p className="m-0 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">{t.description}</p>}
      <div className="mt-auto flex justify-between gap-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">
        <span>by <a className="hover:underline" href={explorerAddressUrl(t.deployer)} target="_blank" rel="noreferrer">{shortAddr(t.deployer)}</a></span>
        <a className="hover:underline" href={explorerTxUrl(t.txHash)} target="_blank" rel="noreferrer">{timeAgo(t.timestamp) || `block ${t.blockNumber}`}</a>
      </div>
      <a className={`${ghostButtonClass} w-full`} href={explorerTokenUrl(t.token)} target="_blank" rel="noreferrer">
        View token <ArrowUpRight className="size-4" />
      </a>
    </motion.article>
  );
}

/** Pinned card for the official $ZEON token; name and symbol are read from the contract. */
function OfficialTokenCard() {
  const [copied, setCopied] = useState(false);
  const meta = useReadContracts({
    allowFailure: true,
    contracts: (["name", "symbol"] as const).map((functionName) => ({
      address: OFFICIAL_TOKEN,
      abi: erc20Abi,
      functionName,
      chainId: robinhoodChain.id,
    })),
    query: { staleTime: Infinity },
  });
  const name = (meta.data?.[0]?.result as string | undefined) || "ZEON";
  const symbol = ((meta.data?.[1]?.result as string | undefined) || "ZEON").toUpperCase();

  const copy = () => {
    navigator.clipboard?.writeText(OFFICIAL_TOKEN).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Reveal>
      <article className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-white p-5 shadow-[0_0_60px_-20px_rgba(57,255,143,0.45)] sm:p-6 dark:bg-zinc-950/70">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-2xl bg-black ring-1 ring-emerald-500/30">
              <ZeonMark size={52} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="truncate text-xl font-bold tracking-tight">{name}</strong>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <BadgeCheck className="size-3.5" /> Official
                </span>
              </div>
              <span className="font-mono text-sm text-zinc-500 dark:text-zinc-400">${symbol}</span>
              <button
                onClick={copy}
                className="mt-1 flex max-w-full items-center gap-1.5 font-mono text-xs text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                title="Copy contract address"
              >
                <span className="truncate">{OFFICIAL_TOKEN}</span>
                {copied ? <Check className="size-3.5 shrink-0 text-emerald-500" /> : <Copy className="size-3.5 shrink-0" />}
              </button>
            </div>
          </div>
          <a className={`${ghostButtonClass} shrink-0`} href={explorerTokenUrl(OFFICIAL_TOKEN)} target="_blank" rel="noreferrer">
            View token <ArrowUpRight className="size-4" />
          </a>
        </div>
      </article>
    </Reveal>
  );
}
