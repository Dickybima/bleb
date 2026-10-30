import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; /** Shown inline instead of the default full-panel message. */ compact?: boolean };
type State = { error: Error | null };

/** Keeps a crash in one part of the page from blanking the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[fozo] render error:", error);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <section className={this.props.compact ? "notice notice-error" : "panel center stack"}>
        <strong>This section hit a snag.</strong>
        <span className="muted small">{error.message}</span>
        <div className="row gap center-row">
          <button className="btn btn-ghost" onClick={() => this.setState({ error: null })}>Try again</button>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Reload page</button>
        </div>
      </section>
    );
  }
}
