import { ArrowUpRight } from "lucide-react";
import { Avatar } from "./Avatar";
import { TokenizeButton } from "./TokenizeButton";
import { Notice, Panel, Reveal, Skeleton, ghostButtonClass, linkButtonClass } from "@/components/ui/primitives";
import { fmtNum, shortAddr } from "../lib/format";
import { useZoraProfileSocial } from "../lib/profile";
import { zoraProfileUrl } from "../lib/zora";

const SOCIAL_URLS: Record<string, (u: string) => string> = {
  twitter: (u) => `https://x.com/${u}`,
  farcaster: (u) => `https://farcaster.xyz/${u}`,
  instagram: (u) => `https://instagram.com/${u}`,
  tiktok: (u) => `https://tiktok.com/@${u}`,
};

export function ProfileView({ id }: { id: string }) {
  const { data: profile, isPending, isError, error, refetch } = useZoraProfileSocial(id);

  if (isPending) return <Panel><Skeleton className="h-72" /></Panel>;
  if (isError)
    return (
      <Notice tone="error">
        Couldn't load this profile: {(error as Error).message}{" "}
        <button className={linkButtonClass} onClick={() => refetch()}>Retry</button>
      </Notice>
    );
  if (!profile)
    return (
      <Panel className="py-14 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Profile not found</h2>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">No Zora profile matches “{id}”.</p>
      </Panel>
    );

  const socials = Object.entries(profile.socialAccounts).filter(([k, s]) => s?.username && SOCIAL_URLS[k]);

  return (
    <Reveal>
      <Panel className="flex flex-col gap-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar src={profile.avatar} name={profile.handle} size={96} className="ring-4 ring-white shadow-xl dark:ring-zinc-800" />
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{profile.displayName || `@${profile.handle}`}</h1>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">@{profile.handle}{profile.wallet && <> · <span className="font-mono text-sm">{shortAddr(profile.wallet)}</span></>}</p>
            {profile.bio && <p className="mt-3 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{profile.bio}</p>}
            {socials.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {socials.map(([k, s]) => (
                  <a key={k} href={SOCIAL_URLS[k](s!.username!)} target="_blank" rel="noreferrer"
                    className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium capitalize text-zinc-600 transition hover:border-zinc-400 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600">
                    {k} · {s!.username}{s!.followerCount ? ` · ${fmtNum(s!.followerCount)}` : ""}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800">
          {([["Followers", profile.followers], ["Following", profile.following]] as const).map(([k, v]) => (
            <div key={k} className="bg-zinc-50 px-4 py-3.5 dark:bg-zinc-900">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">{k}</span>
              <strong className="mt-1 block font-mono text-2xl font-semibold">{fmtNum(v)}</strong>
            </div>
          ))}
        </div>

        <TokenizeButton handle={profile.handle} />

        <div>
          <a className={ghostButtonClass} href={zoraProfileUrl(profile.handle)} target="_blank" rel="noreferrer">Open on Zora <ArrowUpRight className="size-4" /></a>
        </div>
      </Panel>
    </Reveal>
  );
}
