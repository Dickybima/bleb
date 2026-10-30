import { useState } from "react";
import { Avatar } from "./Avatar";
import { fmtNum, fmtUsd } from "../lib/format";
import { useFomoLeaderboard, type FomoWindow } from "../lib/fomo";
import { launchHref, type ProfileSource } from "../lib/router";
import { useTopProfiles } from "../lib/topProfiles";
import type { ReactNode } from "react";

type Row = { handle: string; displayName?: string; avatar?: string; followers?: number; pnl?: number };

const PAGE_SIZE = 20;

/** Zora and fomo leaderboards side by side. */
const FOMO_WINDOWS: { id: FomoWindow; label: string }[] = [
  { id: "24h", label: "24j" },
  { id: "7d", label: "7h" },
  { id: "30d", label: "30h" },
  { id: "all", label: "Semua" },
];

export function TopProfiles({ compact = false }: { compact?: boolean }) {
  const zora = useTopProfiles();
  const [fomoWindow, setFomoWindow] = useState<FomoWindow>("7d");
  const fomo = useFomoLeaderboard(fomoWindow);
  const fomoManual = fomo.data?.source === "manual";
  return (
    <div className="leaderboards">
      <Leaderboard
        source="zora"
        title="Top Profile Zora"
        subtitle="Diurutkan berdasarkan followers di Zora."
        rows={zora.data ?? []}
        loading={zora.isPending}
        error={zora.isError ? (zora.error as Error).message : undefined}
        onRetry={() => zora.refetch()}
        compact={compact}
      />
      <Leaderboard
        source="fomo"
        title="Top Profile Fomo"
        subtitle={fomoManual ? "Profil fomo.family pilihan, diurutkan berdasarkan followers." : "Leaderboard trader fomo.family."}
        rows={fomo.data?.data ?? []}
        loading={fomo.isPending}
        error={fomo.isError ? (fomo.error as Error).message : undefined}
        onRetry={() => fomo.refetch()}
        compact={compact}
        tabs={
          fomoManual ? undefined : (
            <div className="tabs" role="tablist">
              {FOMO_WINDOWS.map((w) => (
                <button key={w.id} role="tab" aria-selected={fomoWindow === w.id}
                  className={fomoWindow === w.id ? "tab active" : "tab"} onClick={() => setFomoWindow(w.id)}>
                  {w.label}
                </button>
              ))}
            </div>
          )
        }
        emptyText={fomoManual ? "Belum ada profil Fomo. Set FOMO_API_KEY atau isi src/data/fomoProfiles.ts." : "Belum ada data."}
      />
    </div>
  );
}

type LeaderboardProps = {
  source: ProfileSource;
  title: string;
  subtitle: string;
  rows: Row[];
  tabs?: ReactNode;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  compact: boolean;
  emptyText?: string;
};

function Leaderboard({ source, title, subtitle, rows, tabs, loading, error, onRetry, compact, emptyText = "Belum ada data." }: LeaderboardProps) {
  const [shown, setShown] = useState(compact ? 10 : PAGE_SIZE);
  const visible = rows.slice(0, shown);
  // Followers when the source provides them; otherwise the leaderboard's PnL.
  const metric = rows.length === 0 || rows.some((r) => r.followers !== undefined) ? "followers" : "pnl";

  return (
    <section className="panel leaderboard">
      <div className="panel-head">
        <div>
          <h2><span className={`source-dot ${source}`} aria-hidden />{title}</h2>
          <p className="muted">{subtitle}</p>
        </div>
        {tabs}
      </div>

      {error && (
        <div className="notice notice-error">
          Gagal memuat data: {error}{" "}
          {onRetry && <button className="link" onClick={onRetry}>Coba lagi</button>}
        </div>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th className="num">#</th>
              <th>Profil</th>
              <th className="num">{metric === "followers" ? "Followers" : "PnL"}</th>
              <th className="num"><span className="sr-only">Aksi</span></th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }, (_, i) => (
                <tr key={i} className="skeleton-row">
                  <td colSpan={4}><span className="skeleton" /></td>
                </tr>
              ))}
            {visible.map((p, i) => (
              <tr key={p.handle}>
                <td className="num rank">{i + 1}</td>
                <td>
                  <a className="profile-cell" href={launchHref(p.handle, source)}>
                    <Avatar src={p.avatar} name={p.handle} size={36} />
                    <span>
                      <strong>{p.displayName || `@${p.handle}`}</strong>
                      <small className="muted">@{p.handle}</small>
                    </span>
                  </a>
                </td>
                <td className={`num followers ${metric === "pnl" && p.pnl ? (p.pnl > 0 ? "up" : "down") : ""}`}>
                  {metric === "followers" ? fmtNum(p.followers) : fmtUsd(p.pnl)}
                </td>
                <td className="num">
                  <a className="btn btn-primary btn-sm" href={launchHref(p.handle, source)}>Tokenize</a>
                </td>
              </tr>
            ))}
            {!loading && !error && rows.length === 0 && (
              <tr><td colSpan={4} className="muted center">{emptyText}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {compact ? (
        rows.length > shown && <a className="btn btn-ghost block" href="#/top">Lihat semua →</a>
      ) : (
        shown < rows.length && (
          <button className="btn btn-ghost block" onClick={() => setShown((n) => n + PAGE_SIZE)}>Muat lebih banyak</button>
        )
      )}
    </section>
  );
}
