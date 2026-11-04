import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Variant = "solid" | "outline" | "yellow" | "ghostDark";

const base =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold tracking-tight transition-colors sm:px-6";

const variants: Record<Variant, string> = {
  solid: "bg-ink text-paper hover:bg-ink-soft",
  yellow: "bg-highlight text-ink hover:brightness-105",
  outline: "border-2 border-ink text-ink hover:bg-ink hover:text-paper",
  ghostDark: "border-2 border-paper/40 text-paper hover:border-highlight hover:text-highlight",
};

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
};

const hover = { y: -2, scale: 1.02 };
const spring = { type: "spring" as const, stiffness: 320, damping: 22 };

export function LinkButton({
  children,
  to,
  variant = "solid",
  className,
}: CommonProps & { to: string }) {
  return (
    <motion.span
      whileHover={hover}
      transition={spring}
      className="inline-flex"
      style={{ display: "inline-flex" }}
    >
      <Link to={to} className={cn(base, variants[variant], className)}>
        {children}
      </Link>
    </motion.span>
  );
}
