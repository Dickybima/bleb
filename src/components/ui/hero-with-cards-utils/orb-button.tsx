import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const orbButtonVariants = cva(
  "group relative inline-flex select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-950 text-white shadow-[0_8px_24px_-8px_rgba(24,24,27,0.55)] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-10px_rgba(91,124,255,0.65)] dark:bg-white dark:text-zinc-950 dark:shadow-[0_8px_24px_-8px_rgba(255,255,255,0.25)]",
        outline:
          "border border-zinc-300 bg-white/70 text-zinc-900 backdrop-blur hover:-translate-y-0.5 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-100 dark:hover:border-zinc-500",
        warn: "bg-amber-400 text-zinc-950 hover:-translate-y-0.5",
      },
      size: {
        sm: "h-9 pl-2 pr-4 text-sm",
        default: "h-11 pl-2.5 pr-5 text-[15px]",
        lg: "h-12 pl-3 pr-6 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

const orbSize = { sm: "size-5", default: "size-6", lg: "size-7" } as const;

type CommonProps = VariantProps<typeof orbButtonVariants> & {
  /** Hide the orb (e.g. for compact, text-only buttons). */
  noOrb?: boolean;
  children?: React.ReactNode;
  className?: string;
};
type ButtonProps = CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type AnchorProps = CommonProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/** The glowing orb: a cool sphere and a warm sphere, echoing the FOZO mark. */
function Orb({ size }: { size: keyof typeof orbSize }) {
  return (
    <span aria-hidden className={cn("relative mr-1.5 shrink-0 rounded-full transition-transform duration-500 group-hover:rotate-[200deg]", orbSize[size])}>
      <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_28%,#e3f1ff,#7aa2ff_35%,#3b4fe0_70%,#160f5c)]" />
      <span className="absolute inset-0 translate-x-[30%] scale-90 rounded-full bg-[radial-gradient(circle_at_70%_30%,#ffe8c7,#ff9a4d_35%,#ff3d77_75%,#8a0f45)] opacity-90 mix-blend-screen" />
    </span>
  );
}

/** Pill button with a glowing orb. Renders an <a> when `href` is given. */
export const OrbButton = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps | AnchorProps>(
  ({ className, variant, size, noOrb, children, ...props }, ref) => {
    const s = size ?? "default";
    const classes = cn(orbButtonVariants({ variant, size }), noOrb && "px-4", className);
    const content = (
      <>
        {!noOrb && <Orb size={s} />}
        <span className="relative">{children}</span>
      </>
    );
    if (typeof props.href === "string") {
      return (
        <a ref={ref as React.Ref<HTMLAnchorElement>} className={classes} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
          {content}
        </a>
      );
    }
    return (
      <button ref={ref as React.Ref<HTMLButtonElement>} className={classes} {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
        {content}
      </button>
    );
  },
);
OrbButton.displayName = "OrbButton";

export { orbButtonVariants };
