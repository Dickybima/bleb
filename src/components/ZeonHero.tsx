import { useState } from "react";
import { motion } from "motion/react";
import { ArrowUpRight, Coins, MousePointerClick, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { OrbButton } from "@/components/ui/hero-with-cards-utils/orb-button";
import { fmtNum } from "@/lib/format";
import { useTopProfiles } from "@/lib/topProfiles";
import { launchHref } from "@/lib/router";
import { Avatar } from "./Avatar";
import { Skeleton } from "@/components/ui/primitives";

// Fan layout from hero-with-cards: the #1 Zora profile sits in the middle, the rest fan out around it.
const SLOTS = [
  { pos: 0, rotate: 0, delay: 0.6, z: 30 },
  { pos: -1, rotate: -11, delay: 0.75, z: 20 },
  { pos: 1, rotate: 11, delay: 0.75, z: 20 },
  { pos: -2, rotate: -22, delay: 0.9, z: 10 },
  { pos: 2, rotate: 22, delay: 0.9, z: 10 },
];

const CARD_GRADIENTS = [
  "from-[#3b4fe0] via-[#7a5cff] to-[#ff3d77]",
  "from-[#160f5c] via-[#3b4fe0] to-[#7aa2ff]",
  "from-[#8a0f45] via-[#ff3d77] to-[#ff9a4d]",
  "from-[#0f172a] via-[#334155] to-[#64748b]",
  "from-[#ff9a4d] via-[#ff3d77] to-[#7a5cff]",
];

const FEATURES = [
  { icon: Sparkles, text: "Name, ticker, avatar, bio and socials lifted straight from the profile. Zero copy-paste." },
  { icon: MousePointerClick, text: "Pick a creator from Top Profiles, hit Tokenize, sign once." },
  { icon: Coins, text: "Fully on-chain, paired with ETH, creator fees routed to the wallet you choose." },
];

/** Full-bleed profile photo for a hero card; reports a failed load so the card can fall back to its gradient. */
function CardPhoto({ src, alt, onFail }: { src: string; alt: string; onFail: () => void }) {
  return (
    <>
      <img src={src} alt={alt} loading="eager" onError={onFail} className="absolute inset-0 h-full w-full object-cover" />
      {/* Keeps the rank chip and the name/ticker legible over any photo. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30" />
    </>
  );
}

const ticker = (handle: string) => handle.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || handle.toUpperCase();

export function ZeonHero() {
  const top = useTopProfiles();
  const cards = (top.data ?? []).slice(0, SLOTS.length);

  return (
    <section className="flex flex-col items-center px-2 pt-6 text-center sm:pt-10">
      <motion.span
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
      >
        <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />
        ZEON · Robinhood Chain
      </motion.span>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight text-zinc-900 md:text-7xl dark:text-white"
      >
        Turn reach into <em className="whitespace-nowrap font-extrabold italic text-zinc-700 dark:text-zinc-300">a market.</em>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.38, ease: "easeOut" }}
        className="mt-5 max-w-xl text-base leading-relaxed text-zinc-500 md:text-lg dark:text-zinc-400"
      >
        ZEON turns any Zora profile into a live token on Robinhood Chain. It's born on a bonding curve,
        graduates to Uniswap v4 once the crowd shows up, and from there the price is set by belief, not a pitch deck.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.52 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <OrbButton href="#/top">Tokenize a profile</OrbButton>
        <OrbButton variant="outline" noOrb href="#/launch">Launch your own</OrbButton>
      </motion.div>

      {(top.isPending || cards.length > 0) && (
      <div className="relative mt-10 flex h-[300px] w-full items-end justify-center overflow-hidden [--spread:68px] sm:h-[360px] sm:[--spread:100px] md:h-[380px] md:[--spread:124px]">
        {/* Placeholder fan while the Zora ranking loads. */}
        {top.isPending &&
          SLOTS.map((slot, i) => (
            <div
              key={i}
              className="absolute bottom-0 origin-bottom"
              style={{ transform: `translateX(calc(${slot.pos} * var(--spread))) rotate(${slot.rotate}deg)`, zIndex: slot.z }}
            >
              <Skeleton className="h-60 w-40 rounded-2xl ring-2 ring-white/60 sm:h-72 sm:w-48 md:h-80 md:w-56 dark:ring-zinc-700/60" />
            </div>
          ))}
        {cards.map((p, i) => (
          <HeroCard key={p.handle} profile={p} index={i} />
        ))}
      </div>
      )}

      <div className="mt-10 grid w-full max-w-4xl gap-3 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, text }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 * i }}
            className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-left text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400"
          >
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <Icon className="size-4" />
            </span>
            {text}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

type HeroProfile = { handle: string; displayName?: string; avatar?: string; avatarLarge?: string; followers?: number };

function HeroCard({ profile: p, index: i }: { profile: HeroProfile; index: number }) {
  const slot = SLOTS[i];
  const photo = p.avatarLarge ?? p.avatar;
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(photo) && !failed;

  return (
    <motion.a
      href={launchHref(p.handle)}
      aria-label={`Tokenize @${p.handle}`}
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -14 }}
      transition={{ duration: 0.65, delay: slot.delay, ease: [0.22, 1, 0.36, 1] }}
      className="absolute bottom-0 origin-bottom"
      style={{ rotate: slot.rotate, zIndex: slot.z, translateX: `calc(${slot.pos} * var(--spread))` }}
    >
      <Card className="h-60 w-40 overflow-hidden rounded-2xl border-0 p-0 shadow-xl ring-2 ring-white/60 sm:h-72 sm:w-48 md:h-80 md:w-56 dark:ring-zinc-700/60">
        <CardContent className={`relative flex h-full w-full flex-col justify-between bg-gradient-to-br p-4 text-left text-white ${CARD_GRADIENTS[i]}`}>
          {showPhoto ? (
            <CardPhoto src={photo!} alt={p.displayName || p.handle} onFail={() => setFailed(true)} />
          ) : (
            <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/15 blur-2xl" />
          )}
          <div className="relative flex items-center justify-between">
            <span className="rounded-full bg-black/35 px-2 py-0.5 font-mono text-[11px] backdrop-blur">#{i + 1}</span>
            <ArrowUpRight className="size-4 opacity-80 drop-shadow" />
          </div>
          <div className="relative flex flex-col items-start gap-3">
            {!showPhoto && (
              <Avatar name={p.handle} size={52} className="from-white to-white/80 text-zinc-900 ring-2 ring-white/40 dark:from-white dark:to-white/80" />
            )}
            <div className="min-w-0 max-w-full drop-shadow">
              <p className="truncate text-lg font-bold leading-tight">{p.displayName || `@${p.handle}`}</p>
              <p className="truncate text-sm text-white/80">@{p.handle}</p>
            </div>
            <div className="flex w-full items-center justify-between gap-2 border-t border-white/25 pt-3">
              <span className="truncate font-mono text-xs font-semibold">${ticker(p.handle)}</span>
              <span className="font-mono text-xs text-white/85">{fmtNum(p.followers)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.a>
  );
}
