import { useState } from "react";
import { Avatar } from "./Avatar";
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
        subtitle="Diurutkan berdasarkan followers di fomo.family."
        rows={fomoTopProfiles}
        compact={compact}
      />
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

function Leaderboard({ source, title, subtitle, rows, loading, error, onRetry, compact, emptyText = "Belum ada data." }: LeaderboardProps) {
  const [shown, setShown] = useState(compact ? 10 : PAGE_SIZE);
  const visible = rows.slice(0, shown);

  return (
    <section className="panel leaderboard">
      <div className="panel-head">
        <div>
          <h2><span className={`source-dot ${source}`} aria-hidden />{title}</h2>
          <p className="muted">{subtitle}</p>
        </div>
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
              <th className="num">Followers</th>
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
                <td className="num followers">{fmtNum(p.followers)}</td>
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
