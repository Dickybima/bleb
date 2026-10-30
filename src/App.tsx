import { Header } from "./components/Header";
import { Launchpad } from "./components/Launchpad";
import { ZeonHero } from "./components/ZeonHero";
import { HomeBento } from "./components/HomeBento";
import { TopProfiles } from "./components/TopProfiles";
import { Explore } from "./components/Explore";
import { ProfileView } from "./components/ProfileView";
import { ErrorBoundary } from "./components/ErrorBoundary";
import DataRain from "@/components/ui/data-rain";
import { ThemeToggle } from "./components/ThemeToggle";
import { ZeonMark } from "./components/ZeonLogo";
import { Reveal } from "@/components/ui/primitives";
import { useRoute } from "./lib/router";
import { X_URL } from "./lib/site";

export default function App() {
  const route = useRoute();
  // Keyed by route so navigating away from a crashed section resets its boundary.
  const routeKey =
    route.page === "profile" ? `profile:${route.id}` : route.page === "launch" ? `launch:${route.handle ?? ""}` : route.page;
  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden">
      {/* Animated full-screen background behind every page. */}
      <DataRain />
      <ErrorBoundary compact>
        <Header active={route.page} />
      </ErrorBoundary>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-4 pb-20 pt-8 sm:pt-12">
        {route.page === "home" && (
          <>
            <ErrorBoundary>
              <ZeonHero />
            </ErrorBoundary>
            <ErrorBoundary>
              <HomeBento />
            </ErrorBoundary>
            <ErrorBoundary>
              <TopProfiles compact />
            </ErrorBoundary>
          </>
        )}
        {route.page === "launch" && (
          <ErrorBoundary key={routeKey}>
            <Launchpad key={route.handle ?? ""} handle={route.handle} />
          </ErrorBoundary>
        )}
        {route.page === "top" && (
          <ErrorBoundary key={routeKey}>
            <section className="flex flex-col gap-6">
              <Reveal className="text-center">
                <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                  Top <em className="font-extrabold italic text-zinc-600 dark:text-zinc-300">Profiles</em>
                </h1>
              </Reveal>
              <TopProfiles />
            </section>
          </ErrorBoundary>
        )}
        {route.page === "explore" && <ErrorBoundary key={routeKey}><Explore /></ErrorBoundary>}
        {route.page === "profile" && <ErrorBoundary key={routeKey}><ProfileView id={route.id} /></ErrorBoundary>}
      </main>
      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6">
          <span className="flex items-center gap-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">
            <ZeonMark size={18} />
            Built on Robinhood Chain · profiles from Zora
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a
              href={X_URL || "#"}
              target={X_URL ? "_blank" : undefined}
              rel="noreferrer"
              aria-label="X"
              className="inline-flex size-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 transition hover:text-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:text-white"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
