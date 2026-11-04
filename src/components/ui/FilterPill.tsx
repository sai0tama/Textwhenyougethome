import { motion } from "motion/react";

import { cn } from "@/lib/utils";

export function FilterPill({
  label,
  active,
  onClick,
  tone = "light",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  tone?: "light" | "dark";
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn(
        "inline-flex min-h-[44px] items-center rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition-colors sm:text-sm",
        tone === "light"
          ? active
            ? "bg-ink text-highlight shadow-[0_6px_16px_oklch(0.16_0_0/0.3)]"
            : "border border-ink/70 bg-transparent text-ink hover:bg-ink/5"
          : active
            ? "bg-highlight text-ink shadow-[0_6px_18px_oklch(0.96_0.24_118/0.25)]"
            : "border border-paper/50 bg-transparent text-paper hover:border-highlight hover:text-highlight",
        active && "scale-[1.03]",
      )}
    >
      {label}
    </motion.button>
  );
}
