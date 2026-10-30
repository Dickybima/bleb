import { explorerTokenUrl, explorerTxUrl } from "../lib/zora";
import type { useTokenize } from "../lib/useTokenize";

export function LaunchSuccess({ state, symbol }: { state: ReturnType<typeof useTokenize>; symbol: string }) {
  return (
    <div className="center stack">
      <span className="orb big" aria-hidden />
      <h3>${symbol.toUpperCase()} berhasil diluncurkan di Pons!</h3>
      {state.token && <p className="muted mono">{state.token}</p>}
      <div className="row gap center-row">
        {state.txHash && <a className="btn btn-ghost" href={explorerTxUrl(state.txHash)} target="_blank" rel="noreferrer">Lihat transaksi ↗</a>}
        {state.token && <a className="btn btn-ghost" href={explorerTokenUrl(state.token)} target="_blank" rel="noreferrer">Lihat token ↗</a>}
        <a className="btn btn-primary" href="#/explore">Lihat di Explore</a>
      </div>
    </div>
  );
}
