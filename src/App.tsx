import { Header } from "./components/Header";
import { Launchpad } from "./components/Launchpad";
import { TopProfiles } from "./components/TopProfiles";
import { ProfileView } from "./components/ProfileView";
import { useRoute } from "./lib/router";

export default function App() {
  const route = useRoute();
  return (
    <>
      <Header active={route.page} />
      <main className="container">
        {route.page === "launch" && (
          <>
            <Launchpad />
            <TopProfiles compact />
          </>
        )}
        {route.page === "top" && <TopProfiles />}
        {route.page === "profile" && <ProfileView id={route.id} />}
      </main>
      <footer className="footer container">
        <span>Dibangun di atas Zora Coins Protocol · Base</span>
        <span>Bukan aplikasi resmi Zora. Trading koin berisiko tinggi.</span>
      </footer>
    </>
  );
}
