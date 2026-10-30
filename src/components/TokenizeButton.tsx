import { OrbButton } from "@/components/ui/hero-with-cards-utils/orb-button";
import { launchHref } from "../lib/router";

/** Sends the user to the launch form prefilled from this profile. */
export function TokenizeButton({ handle }: { handle: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-5 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-900/40">
      <div className="flex min-w-60 flex-1 flex-col gap-1">
        <strong className="font-semibold">Tokenize this profile</strong>
        <p className="m-0 text-sm text-zinc-500 dark:text-zinc-400">
          Name, ticker <b className="font-mono text-zinc-800 dark:text-zinc-200">${handle.toUpperCase()}</b>, avatar, bio and socials drop straight into the launch form.
        </p>
      </div>
      <OrbButton href={launchHref(handle)}>Tokenize</OrbButton>
    </div>
  );
}
