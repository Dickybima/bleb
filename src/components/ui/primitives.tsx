import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/** Shared Tailwind building blocks so every ZEON screen shares the hero's look. */

export const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-[15px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600 dark:focus:ring-white/5";

export const labelClass = "text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400";

/** Rounded card with the hero's soft ring. */
export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Card
      className={cn(
        "rounded-2xl border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(0,0,0,0.12)] sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/60 dark:shadow-none",
        className,
      )}
      {...props}
    />
  );
}

/** Fades content up into place the first time it scrolls into view. */
export function Reveal({ delay = 0, className, children }: { delay?: number; className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({ title, subtitle, dot, children }: { title: React.ReactNode; subtitle?: React.ReactNode; dot?: boolean; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl dark:text-white">
          {dot && (
            <span
              aria-hidden
              className="size-2.5 rounded-full bg-[#6f8dff] shadow-[0_0_10px_#4b6bff]"
            />
          )}
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Notice({ tone = "info", className, children }: { tone?: "info" | "error"; className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
        "break-words [&_a]:font-medium [&_a]:text-zinc-900 [&_a]:underline dark:[&_a]:text-white",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <span className={cn("block animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80", className)} />;
}

export const linkButtonClass = "font-medium text-zinc-900 underline underline-offset-4 hover:no-underline dark:text-white";

/** Secondary pill used for "Load more", "See all", outbound links. */
export const ghostButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:-translate-y-0.5 hover:border-zinc-300 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-700";
