import { useState } from "react";
import { Avatar } from "./Avatar";
import { useExplore, type ExploreScope, type LaunchedToken } from "../lib/explore";
import { shortAddr, timeAgo } from "../lib/format";
import { explorerAddressUrl, explorerTokenUrl, explorerTxUrl } from "../lib/zora";

const SCOPES: { id: ExploreScope; label: string }[] = [
  { id: "launchpad", label: "Dari launchpad ini" },
  { id: "all", label: "Semua token Pons" },
];

export function Explore() {
  const [scope, setScope] = useState<ExploreScope>("launchpad");
  const query = useExplore(scope);
  const tokens = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Explore</h2>
          <p className="muted">
            Token terbaru yang diluncurkan di Pons V2, dibaca langsung dari Robinhood Chain.
            {query.isFetching && !query.isPending && <span className="live"> · memperbarui…</span>}
          </p>
        </div>
        <div className="tabs" role="tablist">
          {SCOPES.map((s) => (
            <button key={s.id} role="tab" aria-selected={scope === s.id}
              className={scope === s.id ? "tab active" : "tab"} onClick={() => setScope(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {query.isError && (
        <div className="notice notice-error">
          Gagal membaca data dari Robinhood Chain: {(query.error as Error).message}{" "}
          <button className="link" onClick={() => query.refetch()}>Coba lagi</button>
        </div>
      )}

      <div className="token-grid">
        {query.isPending && Array.from({ length: 6 }, (_, i) => <span key={i} className="skeleton token-skeleton" />)}
        {tokens.map((t) => <TokenCard key={t.token} token={t} />)}
      </div>

      {!query.isPending && !query.isError && tokens.length === 0 && (
        <div className="center stack">
          <p className="muted">
            {query.hasNextPage ? "Belum ketemu token di blok terbaru." : "Belum ada token yang diluncurkan."}
          </p>
          <a className="btn btn-primary" href="#/top">Tokenize profil pertama</a>
        </div>
      )}

      {query.hasNextPage && (
        <button className="btn btn-ghost block" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
          {query.isFetchingNextPage ? "Memindai blok sebelumnya…" : "Muat lebih banyak"}
        </button>
      )}
    </section>
  );
}

function TokenCard({ token: t }: { token: LaunchedToken }) {
  const symbol = t.symbol || "???";
  return (
    <article className="token-card">
      <div className="token-head">
        <Avatar src={t.logo} name={symbol} size={52} />
        <div className="token-title">
          <strong>{t.name || symbol}</strong>
          <span className="muted">${symbol.toUpperCase()}</span>
        </div>
        {t.fromLaunchpad && <span className="badge">Launchpad</span>}
      </div>
      {t.description && <p className="token-desc">{t.description}</p>}
      <div className="token-meta muted">
        <span>oleh <a href={explorerAddressUrl(t.deployer)} target="_blank" rel="noreferrer" className="mono">{shortAddr(t.deployer)}</a></span>
        <a href={explorerTxUrl(t.txHash)} target="_blank" rel="noreferrer">{timeAgo(t.timestamp) || `blok ${t.blockNumber}`}</a>
      </div>
      <a className="btn btn-ghost block-sm" href={explorerTokenUrl(t.token)} target="_blank" rel="noreferrer">Lihat token ↗</a>
    </article>
  );
}
