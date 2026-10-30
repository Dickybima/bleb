import { STEP_LABEL, type useTokenize } from "../lib/useTokenize";
import { shortAddr } from "../lib/format";
import { basescanTxUrl } from "../lib/zora";

/** Progress list shown while a tokenize transaction is in flight. */
export function TokenizeSteps({ state, withUpload }: { state: ReturnType<typeof useTokenize>; withUpload: boolean }) {
  if (!state.busy) return null;
  return (
    <ol className="steps">
      {(Object.keys(STEP_LABEL) as (keyof typeof STEP_LABEL)[])
        .filter((s) => withUpload || s !== "upload")
        .map((s) => (
          <li key={s} className={state.stepState(s)}>{STEP_LABEL[s]}</li>
        ))}
      {state.txHash && (
        <li className="muted">
          <a href={basescanTxUrl(state.txHash)} target="_blank" rel="noreferrer">tx {shortAddr(state.txHash)} ↗</a>
        </li>
      )}
    </ol>
  );
}
