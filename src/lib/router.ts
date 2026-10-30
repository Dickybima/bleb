import { useEffect, useState } from "react";

export type Route = { page: "launch" } | { page: "top" } | { page: "profile"; id: string };

function parse(hash: string): Route {
  const path = hash.replace(/^#\/?/, "");
  if (path.startsWith("profile/")) return { page: "profile", id: decodeURIComponent(path.slice(8)) };
  if (path === "top") return { page: "top" };
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
