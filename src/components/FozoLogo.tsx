import { useId } from "react";

/**
 * FOZO mark: a cool orb and a warm orb fusing, with a bright lens where they overlap.
 * An original mark that nods to Zora's orb and fomo's warm palette without reproducing either logo.
 */
export function FozoMark({ size = 32, title }: { size?: number; title?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <defs>
        <radialGradient id={`${id}c`} cx="30%" cy="28%" r="80%">
          <stop offset="0" stopColor="#e3f1ff" />
          <stop offset="0.35" stopColor="#7aa2ff" />
          <stop offset="0.7" stopColor="#3b4fe0" />
          <stop offset="1" stopColor="#160f5c" />
        </radialGradient>
        <radialGradient id={`${id}w`} cx="70%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ffe8c7" />
          <stop offset="0.35" stopColor="#ff9a4d" />
          <stop offset="0.75" stopColor="#ff3d77" />
          <stop offset="1" stopColor="#8a0f45" />
        </radialGradient>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffd6f0" />
        </linearGradient>
        <clipPath id={`${id}k`}>
          <circle cx="24" cy="34" r="20" />
        </clipPath>
      </defs>
      <circle cx="24" cy="34" r="20" fill={`url(#${id}c)`} />
      <circle cx="40" cy="30" r="20" fill={`url(#${id}w)`} />
      {/* The fused lens: warm orb clipped to the cool orb. */}
      <circle cx="40" cy="30" r="20" fill={`url(#${id}l)`} clipPath={`url(#${id}k)`} opacity="0.92" />
    </svg>
  );
}

/** Mark plus "FOZO" wordmark, for the header. */
export function FozoLogo({ size = 30 }: { size?: number }) {
  return (
    <span className="fozo-logo">
      <FozoMark size={size} />
      <span className="fozo-word">FOZO</span>
    </span>
  );
}
