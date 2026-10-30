import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * ZEON mark: a neon "Z" (cyan → violet → pink) on a dark badge, circled by a thin orbit with a spark.
 * Neon for the name, the orbit for the "eon". Mirrors public/favicon.svg.
 */
export function ZeonMark({ size = 32, title, className }: { size?: number; title?: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  const z = "M18.5 19.5H45.5L18.5 44.5H45.5";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={cn("shrink-0", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <defs>
        <radialGradient id={`${id}bg`} cx="28%" cy="18%" r="95%">
          <stop offset="0" stopColor="#312e81" />
          <stop offset="0.5" stopColor="#18181b" />
          <stop offset="1" stopColor="#09090b" />
        </radialGradient>
        <linearGradient id={`${id}n`} x1="14" y1="14" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="0.5" stopColor="#818cf8" />
          <stop offset="1" stopColor="#f472b6" />
        </linearGradient>
        <filter id={`${id}g`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="18" fill={`url(#${id}bg)`} />
      <rect x="2.5" y="2.5" width="59" height="59" rx="17.5" fill="none" stroke="#fff" strokeOpacity="0.12" />
      <ellipse cx="32" cy="32" rx="25" ry="9" transform="rotate(-28 32 32)" fill="none" stroke={`url(#${id}n)`} strokeOpacity="0.5" strokeWidth="1.3" />
      {/* Glow pass, crisp pass, then a thin highlight along the top stroke. */}
      <path d={z} fill="none" stroke={`url(#${id}n)`} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${id}g)`} opacity="0.85" />
      <path d={z} fill="none" stroke={`url(#${id}n)`} strokeWidth="7.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.5 19.5H43.5" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="50.2" cy="18" r="3.4" fill="#f0abfc" filter={`url(#${id}g)`} />
      <circle cx="50.2" cy="18" r="2.2" fill="#fff" />
    </svg>
  );
}

/** Mark plus "ZEON" wordmark ("ON" in the neon gradient), for the navbar. */
export function ZeonLogo({ size = 30 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <ZeonMark size={size} />
      <span className="hidden text-lg font-extrabold tracking-[0.06em] text-zinc-900 min-[420px]:inline md:text-2xl dark:text-white">
        ZE<span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">ON</span>
      </span>
    </span>
  );
}
