import { useEffect, useState } from "react";

export type Route =
  | { page: "home" }
  | { page: "launch"; handle?: string }
  | { page: "top" }
  | { page: "explore" }
  | { page: "profile"; id: string }
  | { page: "token"; address: string };

function parse(hash: string): Route {
  const path = hash.replace(/^#\/?/, "");
  if (path.startsWith("profile/")) return { page: "profile", id: decodeURIComponent(path.slice(8)) };
  if (path.startsWith("launch/")) return { page: "launch", handle: decodeURIComponent(path.slice(7)) };
  if (path === "launch") return { page: "launch" };
  // Explore and token pages are hidden on Elysium for now (they read Pons V2 on Robinhood Chain); old links land on Home.
  if (path === "top") return { page: "top" };
  return { page: "home" };
}

export function useRoute() {
  const [route, setRoute] = useState(() => parse(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parse(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export const profileHref = (id: string) => `#/profile/${encodeURIComponent(id)}`;
/** Token detail page: chart, stats and trades. */
export const tokenHref = (address: string) => `#/token/${address.toLowerCase()}`;
/** Launch form prefilled from the given Zora profile. */
export const launchHref = (handle: string) => `#/launch/${encodeURIComponent(handle)}`;
