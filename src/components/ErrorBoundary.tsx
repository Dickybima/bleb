import { Component, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = { children: ReactNode; /** Shown inline instead of the default full-panel message. */ compact?: boolean };
type State = { error: Error | null };

const btn = "inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition";

/** Keeps a crash in one part of the page from blanking the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[zeon] render error:", error);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <section
        className={cn(
          "flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 text-center text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
          this.props.compact ? "p-3 text-sm" : "p-8",
        )}
      >
        <strong>This section hit a snag.</strong>
        <span className="text-sm opacity-80">{error.message}</span>
        <div className="flex flex-wrap justify-center gap-2">
          <button className={cn(btn, "border border-red-300 dark:border-red-800")} onClick={() => this.setState({ error: null })}>Try again</button>
          <button className={cn(btn, "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900")} onClick={() => window.location.reload()}>Reload page</button>
        </div>
      </section>
    );
  }
}
