import { useEffect, useState } from "react";

/** Where a launch form's prefill comes from. */
export type ProfileSource = "zora" | "fomo";

export type Route =
  | { page: "launch"; handle?: string; source?: ProfileSource }
  | { page: "top" }
  | { page: "explore" }
  | { page: "profile"; id: string };

function parse(hash: string): Route {
  const path = hash.replace(/^#\/?/, "");
  if (path.startsWith("profile/")) return { page: "profile", id: decodeURIComponent(path.slice(8)) };
  if (path.startsWith("launch/fomo/")) return { page: "launch", source: "fomo", handle: decodeURIComponent(path.slice(12)) };
  if (path.startsWith("launch/")) return { page: "launch", source: "zora", handle: decodeURIComponent(path.slice(7)) };
  if (path === "top") return { page: "top" };
  if (path === "explore") return { page: "explore" };
  return { page: "launch" };
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
/** Launch form prefilled from the given Zora (default) or fomo profile. */
export const launchHref = (handle: string, source: ProfileSource = "zora") =>
  source === "fomo" ? `#/launch/fomo/${encodeURIComponent(handle)}` : `#/launch/${encodeURIComponent(handle)}`;
