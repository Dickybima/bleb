import { useState } from "react";
import { Avatar } from "./Avatar";
import { fmtNum } from "../lib/format";
import { launchHref } from "../lib/router";
import { useTopProfiles } from "../lib/topProfiles";

const PAGE_SIZE = 20;

export function TopProfiles({ compact = false }: { compact?: boolean }) {
  const query = useTopProfiles();
  const [shown, setShown] = useState(compact ? 10 : PAGE_SIZE);
  const all = query.data ?? [];
  const rows = all.slice(0, shown);

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Top Profile Zora</h2>
          <p className="muted">Diurutkan berdasarkan jumlah followers di Zora.</p>
        </div>
      </div>

      {query.isError && (
        <div className="notice notice-error">
          Gagal memuat data: {(query.error as Error).message}{" "}
          <button className="link" onClick={() => query.refetch()}>Coba lagi</button>
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
            {query.isPending &&
              Array.from({ length: compact ? 5 : 10 }, (_, i) => (
                <tr key={i} className="skeleton-row">
                  <td colSpan={4}><span className="skeleton" /></td>
                </tr>
              ))}
            {rows.map((p, i) => (
              <tr key={p.handle}>
                <td className="num rank">{i + 1}</td>
                <td>
                  <a className="profile-cell" href={launchHref(p.handle)}>
                    <Avatar src={p.avatar} name={p.handle} size={36} />
                    <span>
                      <strong>{p.displayName || `@${p.handle}`}</strong>
                      <small className="muted">@{p.handle}</small>
                    </span>
                  </a>
                </td>
                <td className="num followers">{fmtNum(p.followers)}</td>
                <td className="num">
                  <a className="btn btn-primary btn-sm" href={launchHref(p.handle)}>Tokenize</a>
                </td>
              </tr>
            ))}
            {!query.isPending && !query.isError && all.length === 0 && (
              <tr><td colSpan={4} className="muted center">Belum ada data.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {compact ? (
        <a className="btn btn-ghost block" href="#/top">Lihat semua top profile →</a>
      ) : (
        shown < all.length && (
          <button className="btn btn-ghost block" onClick={() => setShown((n) => n + PAGE_SIZE)}>Muat lebih banyak</button>
        )
      )}
    </section>
  );
}
