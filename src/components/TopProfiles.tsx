import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Avatar } from "./Avatar";
import { OrbButton } from "@/components/ui/hero-with-cards-utils/orb-button";
import { Notice, Panel, Reveal, SectionHeading, Skeleton, ghostButtonClass, linkButtonClass } from "@/components/ui/primitives";
import { fmtNum } from "../lib/format";
import { fomoTopProfiles } from "../lib/fomo";
import { launchHref, type ProfileSource } from "../lib/router";
import { useTopProfiles } from "../lib/topProfiles";

type Row = { handle: string; displayName?: string; avatar?: string; followers?: number };

const PAGE_SIZE = 25;

/** Zora and fomo leaderboards side by side. */
export function TopProfiles({ compact = false }: { compact?: boolean }) {
  const zora = useTopProfiles();
  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
      <Reveal>
        <Leaderboard
          source="zora"
          title="Top Zora Profiles"
          subtitle="Ranked by Zora followers."
          rows={zora.data ?? []}
          loading={zora.isPending}
          error={zora.isError ? (zora.error as Error).message : undefined}
          onRetry={() => zora.refetch()}
          compact={compact}
        />
      </Reveal>
      <Reveal delay={0.08}>
        <Leaderboard
          source="fomo"
          title="Top Fomo Profiles"
          subtitle="Ranked by fomo.family followers."
          rows={fomoTopProfiles}
          compact={compact}
        />
      </Reveal>
    </div>
  );
}

type LeaderboardProps = {
  source: ProfileSource;
  title: string;
  subtitle: string;
  rows: Row[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  compact: boolean;
  emptyText?: string;
};

function Leaderboard({ source, title, subtitle, rows, loading, error, onRetry, compact, emptyText = "Nothing here yet." }: LeaderboardProps) {
  const [shown, setShown] = useState(compact ? 10 : PAGE_SIZE);
  const visible = rows.slice(0, shown);

  return (
    <Panel className="px-3 sm:px-6">
      <div className="px-2 sm:px-0">
        <SectionHeading title={title} subtitle={subtitle} dot={source} />
      </div>

      {error && (
        <Notice tone="error" className="mb-3">
          Couldn't load: {error}{" "}
          {onRetry && <button className={linkButtonClass} onClick={onRetry}>Retry</button>}
        </Notice>
      )}

      <table className="w-full border-collapse tabular-nums">
        <thead>
          <tr className="border-b border-zinc-200 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
            <th className="w-8 py-2.5 pl-2 text-left font-semibold max-[380px]:hidden">#</th>
            <th className="py-2.5 pl-2 text-left font-semibold">Profile</th>
            <th className="py-2.5 pr-2 text-right font-semibold">Followers</th>
            <th className="py-2.5"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 5 }, (_, i) => (
              <tr key={i}>
                <td colSpan={4} className="py-2"><Skeleton className="h-11" /></td>
              </tr>
            ))}
          {visible.map((p, i) => (
            <tr key={p.handle} className="group border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50 dark:border-zinc-800/70 dark:hover:bg-zinc-800/40">
              <td className="py-3 pl-2 font-mono text-xs text-zinc-400 max-[380px]:hidden">{i + 1}</td>
              <td className="py-3 pl-2">
                <a className="flex min-w-0 items-center gap-3" href={launchHref(p.handle, source)}>
                  <Avatar src={p.avatar} name={p.handle} size={36} className="max-sm:!size-8" />
                  <span className="flex min-w-0 flex-col">
                    <strong className="max-w-[92px] truncate font-semibold min-[420px]:max-w-[140px] sm:max-w-[200px]">{p.displayName || `@${p.handle}`}</strong>
                    <small className="max-w-[92px] truncate text-[13px] text-zinc-500 min-[420px]:max-w-[140px] sm:max-w-[200px] dark:text-zinc-400">@{p.handle}</small>
                  </span>
                </a>
              </td>
              <td className="whitespace-nowrap py-3 pr-2 text-right font-mono text-[13px] font-semibold sm:text-sm">{fmtNum(p.followers)}</td>
              <td className="py-3 pr-1 text-right">
                <OrbButton href={launchHref(p.handle, source)} size="sm" noOrb className="h-8 px-3 text-xs sm:px-4 sm:text-[13px]">
                  Tokenize
                </OrbButton>
              </td>
            </tr>
          ))}
          {!loading && !error && rows.length === 0 && (
            <tr><td colSpan={4} className="py-8 text-center text-sm text-zinc-500">{emptyText}</td></tr>
          )}
        </tbody>
      </table>

      {compact ? (
        rows.length > shown && (
          <a className={`${ghostButtonClass} mt-4 w-full`} href="#/top">See all <ArrowRight className="size-4" /></a>
        )
      ) : (
        shown < rows.length && (
          <button className={`${ghostButtonClass} mt-4 w-full`} onClick={() => setShown((n) => n + PAGE_SIZE)}>Load more</button>
        )
      )}
    </Panel>
  );
}
