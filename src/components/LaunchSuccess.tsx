import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { OrbButton } from "@/components/ui/hero-with-cards-utils/orb-button";
import { ghostButtonClass } from "@/components/ui/primitives";
import { FozoMark } from "./FozoLogo";
import { explorerTokenUrl, explorerTxUrl } from "../lib/zora";
import type { useTokenize } from "../lib/useTokenize";

export function LaunchSuccess({ state, symbol }: { state: ReturnType<typeof useTokenize>; symbol: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-4 py-6 text-center"
    >
      <motion.span initial={{ rotate: -40 }} animate={{ rotate: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
        <FozoMark size={72} />
      </motion.span>
      <h3 className="text-2xl font-bold tracking-tight">${symbol.toUpperCase()} <em className="italic text-zinc-500 dark:text-zinc-400">is live.</em></h3>
      {state.token && <p className="m-0 break-all font-mono text-xs text-zinc-500 dark:text-zinc-400">{state.token}</p>}
      <div className="flex flex-wrap justify-center gap-2">
        {state.txHash && <a className={ghostButtonClass} href={explorerTxUrl(state.txHash)} target="_blank" rel="noreferrer">View transaction <ArrowUpRight className="size-4" /></a>}
        {state.token && <a className={ghostButtonClass} href={explorerTokenUrl(state.token)} target="_blank" rel="noreferrer">View token <ArrowUpRight className="size-4" /></a>}
        <OrbButton href="#/explore" size="sm">See it in Explore</OrbButton>
      </div>
    </motion.div>
  );
}
