import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
const KEY = "fozo:theme";
const listeners = new Set<() => void>();

/** index.html applies the saved theme (dark by default) before first paint; the <html> class is the source of truth. */
const current = (): Theme => (document.documentElement.classList.contains("dark") ? "dark" : "light");

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // storage unavailable: the choice just won't persist
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Shared light/dark theme; every caller sees the same value. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, current, () => "dark" as Theme);
  const toggle = useCallback(() => setTheme(current() === "dark" ? "light" : "dark"), []);
  return { theme, toggle };
}
