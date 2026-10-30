import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { useAccount } from "wagmi";
import { useChainModal, useConnectModal } from "@rainbow-me/rainbowkit";
import { getAddress, isAddress, type Address } from "viem";
import { useZoraProfile } from "../lib/profile";
import { Avatar } from "./Avatar";
import { FozoHero } from "./FozoHero";
import { OrbButton } from "@/components/ui/hero-with-cards-utils/orb-button";
import { Notice, Panel, Reveal, SectionHeading, Skeleton, ghostButtonClass, inputClass, labelClass, linkButtonClass } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { LaunchSuccess } from "./LaunchSuccess";
import { TokenizeSteps } from "./TokenizeSteps";
import { robinhoodChain } from "../lib/chains";
import { LIMITS, type Socials } from "../lib/pons";
import { socialsFromProfile } from "../lib/profileSocials";
import { useTokenize } from "../lib/useTokenize";
import { shortAddr } from "../lib/format";
import { hasApiKey } from "../lib/zora";

/**
 * Launch page. With `handle`, the form is prefilled from that Zora profile;
 * otherwise from the connected wallet's Zora profile.
 */
export function Launchpad({ handle }: { handle?: string }) {
  const { address } = useAccount();
  const profileQuery = useZoraProfile(handle ?? address);
  const zoraProfile = profileQuery.data;
  const loading = Boolean(handle ?? address) && profileQuery.isPending;
  const formRef = useRef<HTMLDivElement>(null);

  const profile: ProfileDefaults | undefined = zoraProfile
    ? {
        handle: zoraProfile.handle,
        displayName: zoraProfile.displayName,
        description: zoraProfile.bio,
        avatar: zoraProfile.avatar,
        socials: socialsFromProfile(zoraProfile.socialAccounts, zoraProfile.website),
        wallet: zoraProfile.wallet,
        ownWallets: zoraProfile.wallets,
      }
    : undefined;

  const card = (
    <Panel>
      {profileQuery.isError ? (
        <Notice tone="error">
          Couldn't load the Zora profile: {(profileQuery.error as Error).message}{" "}
          <button className={linkButtonClass} onClick={() => profileQuery.refetch()}>Retry</button>
        </Notice>
      ) : handle && !loading && !profile ? (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <h3 className="text-lg font-bold">@{handle} isn't on Zora</h3>
          <a className={ghostButtonClass} href="#/top">Browse top profiles</a>
        </div>
      ) : loading ? (
        <Skeleton className="h-96" />
      ) : (
        <LaunchForm key={handle ?? address ?? ""} profile={profile} />
      )}
    </Panel>
  );

  if (handle) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-3">
        <Reveal>
          <a className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white" href="#/top">
            <ArrowLeft className="size-4" /> Back to Top Profiles
          </a>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl dark:text-white">
            Tokenize <em className="font-extrabold italic text-zinc-600 dark:text-zinc-300">@{handle}</em>
          </h1>
          <p className="mb-4 mt-3 text-zinc-500 dark:text-zinc-400">
            Pre-loaded from @{handle}'s Zora profile. Tweak anything, then send it.
          </p>
        </Reveal>
        <Reveal delay={0.1}>{card}</Reveal>
      </section>
    );
  }

  return (
    <>
      <FozoHero onLaunchOwn={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} />
      <section ref={formRef} className="mx-auto w-full max-w-2xl scroll-mt-24">
        <Reveal>
          <SectionHeading
            title={<>Launch your <em className="italic text-zinc-600 dark:text-zinc-300">own</em></>}
            subtitle="Connect a wallet and its Zora profile drops in automatically."
          />
        </Reveal>
        <Reveal delay={0.1}>{card}</Reveal>
      </section>
    </>
  );
}

function Target({ handle, name, avatar }: { handle: string; name?: string; avatar?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <Avatar src={avatar} name={handle} size={44} />
      <span className="flex min-w-0 flex-1 flex-col">
        <strong className="truncate font-semibold">{name || `@${handle}`}</strong>
        <small className="truncate text-zinc-500 dark:text-zinc-400">@{handle} · Zora profile</small>
      </span>
      <a className={cn(linkButtonClass, "text-sm")} href="#/top">Change</a>
    </div>
  );
}

type ProfileDefaults = {
  handle: string;
  displayName?: string;
  description: string;
  avatar?: string;
  socials: Socials;
  wallet?: string;
  ownWallets: string[];
};

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function LaunchForm({ profile }: { profile?: ProfileDefaults }) {
  const { address: launcher, isConnected, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { openChainModal } = useChainModal();
  const onChain = isConnected && chainId === robinhoodChain.id;
  const tk = useTokenize();
  const { busy, error } = tk;

  const [name, setName] = useState(profile?.displayName || profile?.handle || "");
  // Tickers stay alphanumeric: "@PoorGoat_" → "POORGOAT".
  const [symbol, setSymbol] = useState(profile ? profile.handle.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || profile.handle.toUpperCase() : "");
  const [description, setDescription] = useState(profile?.description ?? "");
  const [logoUrl, setLogoUrl] = useState(profile?.avatar ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [taxPct, setTaxPct] = useState("0");
  const [buyback, setBuyback] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(profile?.avatar);

  const isOwnProfile = Boolean(launcher && profile?.ownWallets.some((w) => w.toLowerCase() === launcher.toLowerCase()));
  const profileWallet = profile?.wallet && isAddress(profile.wallet) ? getAddress(profile.wallet) : undefined;
  const [feeTo, setFeeTo] = useState<"me" | "profile">("me");
  const feeRecipient: Address | undefined = feeTo === "profile" && profileWallet ? profileWallet : launcher;

  useEffect(() => {
    if (!logoFile) return setPreview(logoUrl || undefined);
    const url = URL.createObjectURL(logoFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile, logoUrl]);

  const taxBps = Math.round(Number(taxPct) * 100);
  const formValid = Boolean(name.trim() && symbol.trim()) && Number.isFinite(taxBps) && taxBps >= 0;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isConnected || !launcher) return openConnectModal?.();
    if (!onChain) return openChainModal?.();
    tk.tokenize({
      creator: launcher,
      feeRecipient,
      name: name.trim(),
      symbol: symbol.trim(),
      description,
      logo: logoFile ?? logoUrl.trim(),
      socials: profile?.socials ?? { twitter: "", telegram: "", discord: "", website: "", farcaster: "" },
      creatorTaxBps: taxBps,
      buybackEnabled: buyback,
    });
  };

  if (tk.step === "done") return <LaunchSuccess state={tk} symbol={symbol} />;

  const socials = Object.entries(profile?.socials ?? {}).filter(([, v]) => v);
  const summary: [string, React.ReactNode, boolean][] = [
    ["Network", "Robinhood Chain", false],
    ["Paired with", "ETH", false],
    ["Fee recipient", feeRecipient ? shortAddr(feeRecipient) : "Your wallet", Boolean(feeRecipient)],
  ];

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      {profile && <Target handle={profile.handle} name={profile.displayName} avatar={profile.avatar} />}

      <div className="flex items-start gap-4">
        <label className="group relative shrink-0 cursor-pointer" title={hasApiKey ? "Change logo" : "Logo from URL"}>
          <Avatar src={preview} name={name || "?"} size={92} className="rounded-2xl" />
          <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} disabled={busy || !hasApiKey} />
          {hasApiKey && (
            <span className="absolute inset-x-0 bottom-1.5 flex items-center justify-center gap-1 text-[11px] font-bold text-white drop-shadow">
              <ImagePlus className="size-3" /> Change
            </span>
          )}
        </label>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Field label="Token name">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="yourname" maxLength={LIMITS.name} disabled={busy} required />
          </Field>
          <Field label="Ticker">
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-zinc-400">$</span>
              <input className={cn(inputClass, "pl-7 font-mono uppercase tracking-wide")} value={symbol} onChange={(e) => setSymbol(e.target.value.replace(/\s/g, ""))} placeholder="YOURNAME" maxLength={LIMITS.symbol} disabled={busy} required />
            </div>
          </Field>
        </div>
      </div>

      {!logoFile && (
        <Field label="Logo URL">
          <input className={inputClass} value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" maxLength={LIMITS.logo} disabled={busy} />
        </Field>
      )}

      <Field label="Bio">
        <textarea className={cn(inputClass, "resize-y")} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={LIMITS.description} placeholder="The story behind this profile…" disabled={busy} />
      </Field>

      <div className="flex flex-wrap items-end gap-4">
        <Field label="Creator tax (%)" className="min-w-40 flex-1">
          <input className={cn(inputClass, "font-mono")} type="number" min={0} step={0.1} value={taxPct} onChange={(e) => setTaxPct(e.target.value)} disabled={busy} />
        </Field>
        <label className="flex cursor-pointer items-center gap-2 pb-3 text-sm font-medium">
          <input type="checkbox" className="size-4 accent-zinc-900 dark:accent-white" checked={buyback} onChange={(e) => setBuyback(e.target.checked)} disabled={busy} />
          <span>Enable buyback &amp; burn</span>
        </label>
      </div>

      {profileWallet && launcher && !isOwnProfile && (
        <div className="flex flex-col gap-2">
          <span className={labelClass}>Creator fees go to</span>
          <div className="flex flex-col gap-2 text-sm">
            <label className="flex cursor-pointer items-center gap-2"><input type="radio" className="accent-zinc-900 dark:accent-white" checked={feeTo === "me"} onChange={() => setFeeTo("me")} disabled={busy} /> My wallet (<span className="font-mono">{shortAddr(launcher)}</span>)</label>
            <label className="flex cursor-pointer items-center gap-2"><input type="radio" className="accent-zinc-900 dark:accent-white" checked={feeTo === "profile"} onChange={() => setFeeTo("profile")} disabled={busy} /> @{profile!.handle}'s wallet (<span className="font-mono">{shortAddr(profileWallet)}</span>)</label>
          </div>
        </div>
      )}

      {socials.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {socials.map(([k, v]) => (
            <span key={k} title={v} className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">{k}</span>
          ))}
        </div>
      )}

      <dl className="m-0 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 min-[420px]:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-800">
        {summary.map(([k, v, mono]) => (
          <div key={k} className="bg-zinc-50 px-3.5 py-2.5 dark:bg-zinc-900">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">{k}</dt>
            <dd className={cn("m-0 mt-0.5 text-sm font-semibold", mono && "font-mono")}>{v}</dd>
          </div>
        ))}
      </dl>

      {profile && launcher && !isOwnProfile && (
        <Notice>
          Heads up: you're launching a token for @{profile.handle} from a wallet that isn't theirs. It's a community token, not an official one.
        </Notice>
      )}
      {!profile && launcher && (
        <Notice>No Zora profile on this wallet. Fill it in yourself, or pick a creator from <a href="#/top">Top Profiles</a>.</Notice>
      )}

      <TokenizeSteps state={tk} withUpload={Boolean(logoFile)} />
      {error && <Notice tone="error">{error}</Notice>}

      <OrbButton type="submit" size="lg" className="w-full" disabled={busy || !formValid || (onChain && !tk.ready)}>
        {busy
          ? "Launching…"
          : !isConnected
            ? "Connect wallet to launch"
            : !onChain
              ? "Switch to Robinhood Chain"
              : `Launch $${symbol.toUpperCase() || "TOKEN"}`}
      </OrbButton>
    </form>
  );
}
