import { motion, useReducedMotion } from "motion/react";
import { Instagram } from "lucide-react";
import { INSTAGRAM_PROFILE } from "@/features/home/data/socialPosts";

/**
 * Global floating Instagram button fixed on the right edge of the viewport.
 * Features a dark translucent circular background, white Instagram icon,
 * segmented neon-lime glowing ring with crosshair ticks, and a subtle tooltip.
 */
export function FloatingInstagram() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <aside
      aria-label="Social media floating link"
      className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50"
    >
      <motion.a
        href={INSTAGRAM_PROFILE}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Follow us on Instagram (opens in new tab)"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="group relative flex size-14 sm:size-16 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
      >
        {/* Tooltip on hover/focus */}
        <span
          role="tooltip"
          aria-hidden="true"
          className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-full border border-paper/20 bg-ink-soft/95 px-3 py-1.5 text-xs font-medium text-paper opacity-0 shadow-2xl backdrop-blur-md transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 translate-x-2"
        >
          Follow us on Instagram
        </span>

        {/* SVG Container for Crosshair Ticks & Glowing Segmented Ring */}
        <svg
          viewBox="0 0 72 72"
          className="absolute inset-0 size-full transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            <filter id="insta-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 4 Outer Crosshair Ticks */}
          <line
            x1="36"
            y1="3"
            x2="36"
            y2="10"
            stroke="#efefef"
            strokeWidth="1.25"
            strokeOpacity="0.45"
          />
          <line
            x1="36"
            y1="62"
            x2="36"
            y2="69"
            stroke="#efefef"
            strokeWidth="1.25"
            strokeOpacity="0.45"
          />
          <line
            x1="3"
            y1="36"
            x2="10"
            y2="36"
            stroke="#efefef"
            strokeWidth="1.25"
            strokeOpacity="0.45"
          />
          <line
            x1="62"
            y1="36"
            x2="69"
            y2="36"
            stroke="#efefef"
            strokeWidth="1.25"
            strokeOpacity="0.45"
          />

          {/* Outer Segmented Neon-Lime Border */}
          <circle
            cx="36"
            cy="36"
            r="27"
            fill="none"
            stroke="#effe09"
            strokeWidth="1.75"
            strokeDasharray="45 15 70 18"
            strokeLinecap="round"
            filter="url(#insta-glow)"
            className="opacity-80 transition-opacity duration-300 group-hover:opacity-100"
          />

          {/* Inner Dark Circular Background */}
          <circle
            cx="36"
            cy="36"
            r="23"
            fill="#000201"
            fillOpacity="0.92"
            stroke="#efefef"
            strokeWidth="1"
            strokeOpacity="0.15"
          />
        </svg>

        {/* Center White Instagram Icon */}
        <Instagram className="relative z-10 size-5 text-paper transition-all duration-300 group-hover:scale-110 group-hover:text-white sm:size-6" />
      </motion.a>
    </aside>
  );
}
