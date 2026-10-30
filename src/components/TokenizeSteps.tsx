import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEP_LABEL, type useTokenize } from "../lib/useTokenize";
import { shortAddr } from "../lib/format";
import { explorerTxUrl } from "../lib/zora";

/** Progress list shown while a tokenize transaction is in flight. */
export function TokenizeSteps({ state, withUpload }: { state: ReturnType<typeof useTokenize>; withUpload: boolean }) {
  if (!state.busy) return null;
  return (
    <ol className="m-0 flex list-none flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-[13px] dark:border-zinc-800 dark:bg-zinc-900">
      {(Object.keys(STEP_LABEL) as (keyof typeof STEP_LABEL)[])
        .filter((s) => withUpload || s !== "upload")
        .map((s) => {
          const st = state.stepState(s);
          return (
            <li key={s} className={cn("flex items-center gap-2", st === "done" ? "text-emerald-600 dark:text-emerald-400" : st === "active" ? "text-zinc-900 dark:text-white" : "text-zinc-400")}>
              {st === "done" ? <Check className="size-4" /> : st === "active" ? <Loader2 className="size-4 animate-spin" /> : <span className="size-4" />}
              {STEP_LABEL[s]}
            </li>
          );
        })}
      {state.txHash && (
        <li className="pl-6 text-zinc-500">
          <a className="underline underline-offset-4" href={explorerTxUrl(state.txHash)} target="_blank" rel="noreferrer">tx {shortAddr(state.txHash)} ↗</a>
        </li>
      )}
    </ol>
  );
}
