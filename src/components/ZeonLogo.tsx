import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * ZEON mark: a "Z" blending neon green into Zora blue on a black badge, circled by a thin orbit with a spark.
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
          <stop offset="0" stopColor="#161616" />
          <stop offset="0.55" stopColor="#050505" />
          <stop offset="1" stopColor="#000000" />
        </radialGradient>
        <linearGradient id={`${id}n`} x1="14" y1="14" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#b6ff1f" />
          <stop offset="0.3" stopColor="#39ff8f" />
          <stop offset="0.55" stopColor="#2fb8ff" />
          <stop offset="0.8" stopColor="#4d6bff" />
        </linearGradient>
        <filter id={`${id}g`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="18" fill={`url(#${id}bg)`} />
      <rect x="2.5" y="2.5" width="59" height="59" rx="17.5" fill="none" stroke="#fff" strokeOpacity="0.12" />
      <ellipse cx="32" cy="32" rx="25" ry="9" transform="rotate(-28 32 32)" fill="none" stroke={`url(#${id}n)`} strokeOpacity="0.65" strokeWidth="1.4" />
      {/* Glow pass, crisp pass, then a thin highlight along the top stroke. */}
      <path d={z} fill="none" stroke={`url(#${id}n)`} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${id}g)`} opacity="0.85" />
      <path d={z} fill="none" stroke={`url(#${id}n)`} strokeWidth="7.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.5 19.5H43.5" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="50.2" cy="18" r="3.6" fill="#b6ff1f" filter={`url(#${id}g)`} />
      <circle cx="50.2" cy="18" r="2.2" fill="#fff" />
    </svg>
  );
}

/** Mark plus "ZEON" wordmark ("ON" in the green → blue gradient), for the navbar. */
export function ZeonLogo({ size = 30 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <ZeonMark size={size} />
      <span className="hidden text-lg font-extrabold tracking-[0.06em] text-zinc-900 min-[420px]:inline md:text-2xl dark:text-white">
        ZE<span className="bg-[linear-gradient(90deg,#9be31a,#22d97a_40%,#2fb8ff_70%,#4d6bff)] bg-clip-text text-transparent dark:bg-[linear-gradient(90deg,#b6ff1f,#39ff8f_40%,#2fb8ff_70%,#4d6bff)]">ON</span>
      </span>
    </span>
  );
}
