import { Header } from "./components/Header";
import { Launchpad } from "./components/Launchpad";
import { TopProfiles } from "./components/TopProfiles";
import { Explore } from "./components/Explore";
import { ProfileView } from "./components/ProfileView";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useRoute } from "./lib/router";
import { X_URL } from "./lib/site";

export default function App() {
  const route = useRoute();
  // Keyed by route so navigating away from a crashed section resets its boundary.
  const routeKey = route.page === "profile" ? `profile:${route.id}` : route.page === "launch" ? `launch:${route.handle ?? ""}` : route.page;
  return (
    <>
      <ErrorBoundary compact>
        <Header active={route.page} />
      </ErrorBoundary>
      <main className="container">
        {route.page === "launch" && (
          <>
            <ErrorBoundary key={routeKey}>
              <Launchpad key={route.handle ?? ""} handle={route.handle} />
            </ErrorBoundary>
            {!route.handle && (
              <ErrorBoundary>
                <TopProfiles compact />
              </ErrorBoundary>
            )}
          </>
        )}
        {route.page === "top" && <ErrorBoundary key={routeKey}><TopProfiles /></ErrorBoundary>}
        {route.page === "explore" && <ErrorBoundary key={routeKey}><Explore /></ErrorBoundary>}
        {route.page === "profile" && <ErrorBoundary key={routeKey}><ProfileView id={route.id} /></ErrorBoundary>}
      </main>
      <footer className="footer container">
        <span>Dibangun di Robinhood Chain · data profil dari Zora</span>
        <a className="social-link" href={X_URL || "#"} target={X_URL ? "_blank" : undefined} rel="noreferrer" aria-label="X">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
      </footer>
    </>
  );
}
