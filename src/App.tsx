import { Header } from "./components/Header";
import { Launchpad } from "./components/Launchpad";
import { TopProfiles } from "./components/TopProfiles";
import { Explore } from "./components/Explore";
import { ProfileView } from "./components/ProfileView";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useRoute } from "./lib/router";

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
        <span>Bukan aplikasi resmi Zora. Trading token berisiko tinggi.</span>
      </footer>
    </>
  );
}
