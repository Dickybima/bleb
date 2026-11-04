import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowUpRight, AtSign, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { isAddress } from "viem";
import { useZoraProfile, type ZoraProfile } from "../lib/profile";
import { Avatar } from "./Avatar";
import { OrbButton } from "@/components/ui/hero-with-cards-utils/orb-button";
import { Notice, Panel, Reveal, Skeleton, inputClass, labelClass } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { LIMITS } from "../lib/pons";
import { BOXA_URL } from "../lib/site";
import { socialsFromProfile } from "../lib/profileSocials";
import { fmtNum, shortAddr } from "../lib/format";

type Source = "handle" | "wallet";

/** Tickers stay alphanumeric: "@PoorGoat_" → "POORGOAT". */
const tickerFrom = (handle: string) => handle.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || handle.toUpperCase();

/**
 * Launch studio. Step 1 detects a Zora profile (by handle, or the connected wallet's);
 * step 2 reviews every token field and launches. With `handle`, that profile is detected on load.
 */
export function Launchpad({ handle }: { handle?: string }) {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  // ── Step 1: detection ────────────────────────────────────────────────
  const [source, setSource] = useState<Source>("handle");
  const [handleInput, setHandleInput] = useState(handle ?? "");
  const [target, setTarget] = useState<string | undefined>(handle);
  const detection = useZoraProfile(target);
  const detected = target ? detection.data : undefined;
  const userPicked = useRef(Boolean(handle));

  // Without a handle in the URL, start from the connected wallet's profile until the user picks something else.
  useEffect(() => {
    if (!userPicked.current && address) {
      setSource("wallet");
      setTarget(address);
    }
  }, [address]);

  const detectHandle = (e?: FormEvent) => {
    e?.preventDefault();
    const h = handleInput.trim().replace(/^@/, "");
    if (!h) return;
    userPicked.current = true;
    setTarget(h);
  };
  const detectWallet = () => {
    userPicked.current = true;
    if (!isConnected || !address) return openConnectModal?.();
    setTarget(address);
  };

  // ── Form state (both steps) ──────────────────────────────────────────
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [coinName, setCoinName] = useState("");
  const [ticker, setTicker] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");
  const [farcaster, setFarcaster] = useState("");
  // Coin name / description follow the profile fields until edited by hand.
  const edited = useRef({ coinName: false, description: false });

  // Apply a freshly detected profile to every field.
  const applied = useRef<string | null>(null);
  useEffect(() => {
    if (!detected || applied.current === detected.handle) return;
    applied.current = detected.handle;
    const socials = socialsFromProfile(detected.socialAccounts, detected.website);
    edited.current = { coinName: false, description: false };
    setHandleInput(detected.handle);
    setDisplayName(detected.displayName ?? "");
    setBio(detected.bio);
    setCoinName(detected.displayName || detected.handle);
    setTicker(tickerFrom(detected.handle));
    setDescription(detected.bio);
    setLogoUrl(detected.avatar ?? "");
    setTwitter(socials.twitter);
    setWebsite(socials.website);
    setFarcaster(socials.farcaster);
  }, [detected]);

  const onDisplayName = (v: string) => {
    setDisplayName(v);
    if (!edited.current.coinName) setCoinName(v);
  };
  const onBio = (v: string) => {
    setBio(v);
    if (!edited.current.description) setDescription(v);
  };

  const title = handle ? (
    <>Tokenize <em className="font-extrabold italic text-zinc-600 dark:text-zinc-300">@{handle}</em></>
  ) : (
    <>Launch your <em className="font-extrabold italic text-zinc-600 dark:text-zinc-300">profile coin</em></>
  );

  return (
    <section className="flex flex-col gap-6">
      <Reveal className="max-w-3xl">
        {handle && (
          <a className="mb-3 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white" href="#/top">
            <ArrowLeft className="size-4" /> Back to Top Profiles
          </a>
        )}
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl dark:text-white">{title}</h1>
        <p className="mt-3 leading-relaxed text-zinc-500 dark:text-zinc-400">
          Pull it from any Zora profile, tune every field, then deploy it on Boxa v4.
          ZEON never holds your keys or your coins.
        </p>
      </Reveal>

      <div className="grid items-start gap-5 lg:grid-cols-2 [&>*]:min-w-0">
        <Reveal>
          <Panel className="flex flex-col gap-5">
            <StepHeading n={1} label="Your profile" />

            <Segmented
              value={source}
              onChange={(v) => setSource(v as Source)}
              options={[
                { value: "handle", label: "@zora", icon: <span className="size-2.5 rounded-full bg-[#4d6bff] shadow-[0_0_8px_#4d6bff]" /> },
                { value: "wallet", label: "My wallet", icon: <Wallet className="size-4" /> },
              ]}
            />

            {source === "handle" ? (
              <form onSubmit={detectHandle} className="flex flex-col gap-4">
                <p className="m-0 text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Drop a Zora handle and detect the profile. Name, avatar, bio and socials come straight from Zora, and
                  everything stays editable before you launch.
                </p>
                <Field label="Handle">
                  <div className="relative">
                    <AtSign className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                    <input className={cn(inputClass, "pl-9")} value={handleInput} onChange={(e) => setHandleInput(e.target.value)} placeholder="yourname" aria-label="Zora handle" />
                  </div>
                </Field>
                <OrbButton type="submit" variant="outline" noOrb className="w-full bg-white dark:bg-white dark:text-zinc-950" disabled={!handleInput.trim()}>
                  Detect my Zora profile
                </OrbButton>
              </form>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="m-0 text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Use the Zora profile linked to your connected wallet. Its name, avatar, bio and socials drop straight into
                  the coin.
                </p>
                <OrbButton type="button" variant="outline" noOrb className="w-full bg-white dark:bg-white dark:text-zinc-950" onClick={detectWallet}>
                  {isConnected && address ? `Detect from ${shortAddr(address)}` : "Connect wallet to detect"}
                </OrbButton>
              </div>
            )}

            <DetectionStatus target={target} loading={Boolean(target) && detection.isPending} error={detection.isError ? (detection.error as Error).message : undefined} profile={detected} onRetry={() => detection.refetch()} />

            <Field label="Display name (optional)">
              <input className={inputClass} value={displayName} onChange={(e) => onDisplayName(e.target.value)} placeholder="Your name" maxLength={LIMITS.name} />
            </Field>
            <Field label="Bio (optional)">
              <textarea className={cn(inputClass, "resize-y")} rows={3} value={bio} onChange={(e) => onBio(e.target.value)} placeholder="A line or two about you." maxLength={LIMITS.description} />
            </Field>
            <p className="m-0 text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
              Detect fills these from Zora, or type them in by hand. Then set the coin name, ticker and avatar on the right
              and launch.
            </p>
          </Panel>
        </Reveal>

        <Reveal delay={0.08}>
          <Panel>
            <ReviewAndLaunch
              profile={detected}
              fields={{ coinName, ticker, description, logoUrl, twitter, website, farcaster }}
              set={{
                coinName: (v) => { edited.current.coinName = true; setCoinName(v); },
                ticker: setTicker,
                description: (v) => { edited.current.description = true; setDescription(v); },
                logoUrl: setLogoUrl,
                twitter: setTwitter,
                website: setWebsite,
              }}
            />
          </Panel>
        </Reveal>
      </div>
    </section>
  );
}

function StepHeading({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex size-7 items-center justify-center rounded-lg bg-zinc-900 font-mono text-sm font-bold text-white dark:bg-white dark:text-zinc-900">{n}</span>
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">{label}</span>
    </div>
  );
}

function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string; icon?: ReactNode; disabled?: boolean }[] }) {
  return (
    <div className="grid gap-1 rounded-2xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-950/60" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition",
            value === o.value
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white",
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function DetectionStatus({ target, loading, error, profile, onRetry }: { target?: string; loading: boolean; error?: string; profile?: ZoraProfile | null; onRetry: () => void }) {
  if (!target) return null;
  if (loading) return <Skeleton className="h-16" />;
  if (error)
    return (
      <Notice tone="error">
        Couldn't reach Zora: {error}{" "}
        <button type="button" className="font-medium underline" onClick={onRetry}>Retry</button>
      </Notice>
    );
  if (!profile)
    return (
      <Notice>
        {isAddress(target) ? "No Zora profile on this wallet." : `No Zora profile for @${target}.`} Try another handle, or fill
        the fields yourself.
      </Notice>
    );
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
      <Avatar src={profile.avatar} name={profile.handle} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{profile.displayName || `@${profile.handle}`}</p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          @{profile.handle}
          {profile.followers !== undefined && <> · {fmtNum(profile.followers)} followers</>}
        </p>
      </div>
      <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Detected</span>
    </div>
  );
}

type Fields = { coinName: string; ticker: string; description: string; logoUrl: string; twitter: string; website: string; farcaster: string };
type Setters = { [K in "coinName" | "ticker" | "description" | "logoUrl" | "twitter" | "website"]: (v: string) => void };

/** Step 2: every token field, launch settings, and the launch itself. */
function ReviewAndLaunch({ fields, set }: { profile?: ZoraProfile | null; fields: Fields; set: Setters }) {
  const [copied, setCopied] = useState(false);
  const formValid = Boolean(fields.coinName.trim() && fields.ticker.trim());

  // Deploys happen on Boxa v4: open it and hand over the reviewed details on the clipboard.
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    window.open(BOXA_URL, "_blank", "noopener,noreferrer");
    const details = [
      `Name: ${fields.coinName.trim()}`,
      `Ticker: ${fields.ticker.trim().toUpperCase()}`,
      fields.description.trim() && `Description: ${fields.description.trim()}`,
      fields.logoUrl.trim() && `Image: ${fields.logoUrl.trim()}`,
      fields.twitter.trim() && `X: ${fields.twitter.trim()}`,
      fields.website.trim() && `Website: ${fields.website.trim()}`,
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard?.writeText(details).then(() => setCopied(true), () => {});
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <StepHeading n={2} label="Review and deploy" />

      <div className="flex items-center gap-4">
        <Avatar src={fields.logoUrl || undefined} name={fields.coinName || "?"} size={80} className="rounded-2xl" />
        <input className={cn(inputClass, "flex-1 py-2 text-sm")} value={fields.logoUrl} onChange={(e) => set.logoUrl(e.target.value)} placeholder="Avatar image URL (https://…)" maxLength={LIMITS.logo} aria-label="Logo URL" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Coin name">
          <input className={inputClass} value={fields.coinName} onChange={(e) => set.coinName(e.target.value)} placeholder="Your profile coin" maxLength={LIMITS.name} required />
        </Field>
        <Field label="Ticker">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-zinc-400">$</span>
            <input className={cn(inputClass, "pl-7 font-mono uppercase tracking-wide")} value={fields.ticker} onChange={(e) => set.ticker(e.target.value.replace(/\s/g, ""))} placeholder="TICKER" maxLength={LIMITS.symbol} required />
          </div>
        </Field>
      </div>

      <Field label="Description">
        <textarea className={cn(inputClass, "resize-y")} rows={2} value={fields.description} onChange={(e) => set.description(e.target.value)} placeholder="Who is this profile?" maxLength={LIMITS.description} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="X / Twitter (optional)">
          <input className={inputClass} value={fields.twitter} onChange={(e) => set.twitter(e.target.value)} placeholder="https://x.com/…" maxLength={LIMITS.social} />
        </Field>
        <Field label="Website (optional)">
          <input className={inputClass} value={fields.website} onChange={(e) => set.website(e.target.value)} placeholder="https://…" maxLength={LIMITS.social} />
        </Field>
      </div>

      <Notice>
        {copied
          ? "Details copied. Paste them into the create form on Boxa v4 (opened in a new tab)."
          : "Deploying opens Boxa v4 in a new tab and copies these details, ready to paste into its create form."}
      </Notice>

      <OrbButton type="submit" size="lg" className="w-full" disabled={!formValid}>
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          Deploy ${fields.ticker.toUpperCase() || "TOKEN"} on Boxa v4 <ArrowUpRight className="size-5" />
        </span>
      </OrbButton>
    </form>
  );
}
