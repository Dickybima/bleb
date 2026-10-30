import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConnectButton } from "./ConnectButton";
import { FozoLogo } from "./FozoLogo";
import { ThemeToggle } from "./ThemeToggle";
import { profileHref, type Route } from "../lib/router";

const LINKS: { href: string; page: Route["page"]; label: string }[] = [
  { href: "#/", page: "launch", label: "Launchpad" },
  { href: "#/explore", page: "explore", label: "Explore" },
  { href: "#/top", page: "top", label: "Top Profiles" },
];

/** Bordered navbar in the style of the hero component. */
export function Header({ active }: { active: Route["page"] }) {
  const [query, setQuery] = useState("");

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim().replace(/^@/, "");
    if (q) window.location.hash = profileHref(q);
  };

  return (
    <header className="sticky top-0 z-40 border-t border-b border-zinc-200 bg-zinc-50/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80">
      <nav className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 sm:flex-nowrap sm:gap-5 sm:py-0">
        <a href="#/" aria-label="FOZO" className="shrink-0">
          <FozoLogo />
        </a>
        {/* On phones the links drop to their own row under the logo. */}
        <div className="flex items-center gap-1 max-sm:order-last max-sm:w-full max-sm:justify-center">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={cn(
                "whitespace-nowrap rounded-full px-2 py-1.5 text-[13px] font-medium transition sm:px-3 sm:text-sm",
                active === l.page
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white",
              )}
            >
              {l.label}
            </a>
          ))}
        </div>
        <form onSubmit={onSearch} role="search" className="ml-auto hidden flex-1 justify-end lg:flex">
          <label className="relative w-full max-w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search @handle or 0x…"
              aria-label="Search Zora profiles"
              className="h-9 w-full rounded-full border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
            />
          </label>
        </form>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <span className="max-sm:hidden"><ThemeToggle /></span>
          <ConnectButton />
        </div>
      </nav>
    </header>
  );
}
