import { useEffect, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { AtSign, Coins, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrbButton } from "@/components/ui/hero-with-cards-utils/orb-button";
import { Reveal, Skeleton } from "@/components/ui/primitives";
import { Avatar } from "./Avatar";
import { FozoMark } from "./FozoLogo";
import { useExplore } from "../lib/explore";
import { fmtNum } from "../lib/format";
import { useZoraProfileSocial } from "../lib/profile";
import { launchHref } from "../lib/router";
import { useTopProfiles } from "../lib/topProfiles";

const tile =
  "relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/60";
const tileTitle = "text-lg font-bold tracking-tight text-zinc-900 sm:text-xl dark:text-white";
const tileText = "mt-2 max-w-md text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400";
const statLabel = "text-sm text-zinc-500 dark:text-zinc-400";

/** Bento section on Home: how FOZO works plus a few live numbers, above the leaderboard. */
export function HomeBento() {
  return (
    <section className="flex flex-col gap-8">
      <Reveal>
        <h2 className="text-4xl font-bold leading-[1.05] tracking-tight text-zinc-900 md:text-6xl dark:text-white">
          Made for creators.
          <br />
          <span className="text-zinc-400 dark:text-zinc-600">Priced by the crowd.</span>
        </h2>
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Reveal><DetectTile /></Reveal>
        <Reveal delay={0.08}><FlowTile /></Reveal>
      </div>

      <div className="grid gap-4 md:grid-cols-3 [&>*]:min-w-0">
        <Reveal><ReachTile /></Reveal>
        <Reveal delay={0.08}><MintedTile /></Reveal>
        <Reveal delay={0.16}><CustodyTile /></Reveal>
      </div>
    </section>
  );
}

/** Live handle lookup: type a Zora handle, see it detected, jump to its Tokenize form. */
function DetectTile() {
  const top = useTopProfiles();
  const [input, setInput] = useState("");
  const [handle, setHandle] = useState("");

  // Debounce lookups while typing.
  useEffect(() => {
    const t = setTimeout(() => setHandle(input.trim().replace(/^@/, "")), 400);
    return () => clearTimeout(t);
  }, [input]);

  const example = top.data?.[0];
  const typed = Boolean(handle);
  const lookup = useZoraProfileSocial(handle, typed);
  const found = typed ? lookup.data : undefined;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const h = (found?.handle ?? input.trim().replace(/^@/, "")) || example?.handle;
    if (h) window.location.hash = launchHref(h);
  };

  const row = typed
    ? found
      ? { handle: found.handle, name: found.displayName, avatar: found.avatarSmall, followers: found.followers }
      : null
    : example
      ? { handle: example.handle, name: example.displayName, avatar: example.avatar, followers: example.followers }
      : null;

  return (
    <div className={cn(tile, "h-full")}>
      <h3 className={tileTitle}>Detect in one click</h3>
      <p className={tileText}>Drop a Zora handle. Name, avatar, bio and wallet are lifted straight from the profile.</p>

      <form onSubmit={onSubmit} className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
        <div className="flex items-center gap-2">
          <label className="relative flex-1">
            <AtSign className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={example ? example.handle : "handle"}
              aria-label="Zora handle"
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
            />
          </label>
          <OrbButton type="submit" size="sm" noOrb className="h-10">Tokenize</OrbButton>
        </div>

        <div className="mt-3 flex min-h-14 items-center gap-3 rounded-xl bg-white px-3 py-2.5 dark:bg-zinc-900">
          {typed && lookup.isPending ? (
            <Skeleton className="h-9 w-full" />
          ) : row ? (
            <>
              <Avatar src={row.avatar} name={row.handle} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{row.name || `@${row.handle}`}</p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  @{row.handle}
                  {row.followers !== undefined && <> · {fmtNum(row.followers)} followers</>}
                </p>
              </div>
              <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Detected</span>
            </>
          ) : typed ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No Zora profile for @{handle}.</p>
          ) : (
            <Skeleton className="h-9 w-full" />
          )}
        </div>
      </form>
    </div>
  );
}

/** Profile in, token out: Zora profile → FOZO → token on Robinhood Chain. */
function FlowTile() {
  return (
    <div className={cn(tile, "flex h-full flex-col")}>
      <h3 className={tileTitle}>Profile in. Token out.</h3>
      <p className={tileText}>A Zora profile goes in, a Pons V2 token on Robinhood Chain comes out, paired with ETH.</p>

      <div className="flex flex-1 items-center justify-center gap-2 py-8 min-[420px]:gap-3 sm:gap-4">
        <FlowNode label="Zora profile" className="bg-[radial-gradient(circle_at_30%_28%,#e3f1ff,#7aa2ff_35%,#3b4fe0_70%,#160f5c)] shadow-[0_0_40px_-6px_#4b6bff]">
          <AtSign className="size-8 text-white" />
        </FlowNode>
        <FlowLine />
        <FlowNode label="FOZO" className="bg-zinc-950 shadow-[0_0_40px_-8px_rgba(255,61,119,0.6)] dark:bg-black">
          <FozoMark size={44} />
        </FlowNode>
        <FlowLine />
        <FlowNode label="Token" className="bg-lime-300 shadow-[0_0_40px_-6px_#bef264]">
          <Coins className="size-8 text-zinc-950" />
        </FlowNode>
      </div>
    </div>
  );
}

function FlowNode({ label, className, children }: { label: string; className: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.span
        whileHover={{ y: -4, rotate: -4 }}
        className={cn("inline-flex size-14 items-center justify-center rounded-2xl min-[420px]:size-16 sm:size-20", className)}
      >
        {children}
      </motion.span>
      <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</span>
    </div>
  );
}

function FlowLine() {
  return (
    <span className="relative mb-6 h-px w-5 shrink overflow-hidden bg-zinc-300 min-[420px]:w-8 sm:w-14 dark:bg-zinc-700">
      <motion.span
        className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-zinc-900 to-transparent dark:via-white"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </span>
  );
}

function ReachTile() {
  const top = useTopProfiles();
  const total = top.data?.reduce((sum, p) => sum + (p.followers ?? 0), 0);
  return (
    <div className={cn(tile, "h-full min-h-56")}>
      <p className={statLabel}>Combined reach of top profiles</p>
      {top.isPending ? (
        <Skeleton className="mt-3 h-12 w-32" />
      ) : (
        <p className="mt-2 text-5xl font-bold tracking-tighter text-zinc-900 dark:text-white">{total ? fmtNum(total) : "–"}</p>
      )}
      <p className={cn(statLabel, "mt-1")}>followers on Zora</p>
    </div>
  );
}

function MintedTile() {
  const explore = useExplore();
  const tokens = explore.data?.pages.flatMap((p) => p.items) ?? [];
  const more = explore.hasNextPage && tokens.length > 0;
  return (
    <a href="#/explore" className={cn(tile, "flex h-full min-h-56 flex-col transition hover:border-zinc-300 dark:hover:border-zinc-700")}>
      <p className={statLabel}>Latest mints on FOZO</p>
      {explore.isPending ? (
        <Skeleton className="mt-3 h-12 w-16" />
      ) : (
        <p className="mt-2 text-5xl font-bold tracking-tighter text-zinc-900 dark:text-white">
          {tokens.length}
          {more && <span className="text-zinc-400">+</span>}
        </p>
      )}
      <div className="mt-auto flex pt-6">
        {tokens.slice(0, 6).map((t, i) => (
          <Avatar key={t.token} src={t.logo} name={t.symbol || "?"} size={36} className={cn("ring-2 ring-white dark:ring-zinc-900", i > 0 && "-ml-2")} />
        ))}
        {!explore.isPending && tokens.length === 0 && <p className={statLabel}>Be the first to mint.</p>}
      </div>
    </a>
  );
}

function CustodyTile() {
  return (
    <div className={cn(tile, "flex h-full min-h-56 flex-col")}>
      <p className={statLabel}>Non-custodial</p>
      <p className="mt-2 text-3xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-white">
        You sign.
        <br />
        You own.
      </p>
      <ShieldCheck className="ml-auto mt-auto size-16 text-emerald-500" strokeWidth={1.4} />
    </div>
  );
}
