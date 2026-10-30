import { useState } from "react";
import { cn } from "@/lib/utils";

export function Avatar({ src, name, size = 40, className }: { src?: string; name: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const style = { width: size, height: size };
  if (src && failed !== src)
    return (
      <img
        className={cn("shrink-0 rounded-full bg-zinc-200 object-cover dark:bg-zinc-800", className)}
        src={src}
        alt=""
        style={style}
        loading="lazy"
        onError={() => setFailed(src)}
      />
    );
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 font-bold text-white ring-1 ring-black/5 dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-900",
        className,
      )}
      style={{ ...style, fontSize: size * 0.42 }}
      aria-hidden
    >
      {name.replace(/^@/, "").charAt(0).toUpperCase() || "?"}
    </span>
  );
}
