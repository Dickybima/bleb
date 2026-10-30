import { useState, type FormEvent } from "react";
import { ConnectButton } from "./ConnectButton";
import { FozoLogo } from "./FozoLogo";
import { profileHref, type Route } from "../lib/router";

export function Header({ active }: { active: Route["page"] }) {
  const [query, setQuery] = useState("");

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim().replace(/^@/, "");
    if (q) window.location.hash = profileHref(q);
  };

  return (
    <header className="header">
      <div className="container header-inner">
        <a href="#/" className="brand" aria-label="FOZO">
          <FozoLogo />
        </a>
        <nav className="nav">
          <a href="#/" className={active === "launch" ? "active" : ""}>Launchpad</a>
          <a href="#/explore" className={active === "explore" ? "active" : ""}>Explore</a>
          <a href="#/top" className={active === "top" ? "active" : ""}>Top Profile</a>
        </nav>
        <form className="search" onSubmit={onSearch} role="search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari @handle atau 0x…"
            aria-label="Cari profil Zora"
          />
        </form>
        <ConnectButton />
      </div>
    </header>
  );
}
