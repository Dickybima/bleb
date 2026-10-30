import { explorerTokenUrl, explorerTxUrl } from "../lib/zora";
import type { useTokenize } from "../lib/useTokenize";

export function LaunchSuccess({ state, symbol }: { state: ReturnType<typeof useTokenize>; symbol: string }) {
  return (
    <div className="center stack">
      <span className="orb big" aria-hidden />
      <h3>${symbol.toUpperCase()} is live.</h3>
      {state.token && <p className="muted mono">{state.token}</p>}
      <div className="row gap center-row">
        {state.txHash && <a className="btn btn-ghost" href={explorerTxUrl(state.txHash)} target="_blank" rel="noreferrer">View transaction ↗</a>}
        {state.token && <a className="btn btn-ghost" href={explorerTokenUrl(state.token)} target="_blank" rel="noreferrer">View token ↗</a>}
        <a className="btn btn-primary" href="#/explore">See it in Explore</a>
      </div>
    </div>
  );
}
