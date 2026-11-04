import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * Bold, bright orange comic-book speech bubble with an irregular polygon
 * silhouette, subtle halftone dot texture, high-contrast black typography,
 * and an angular speech tail pointing toward the map marker.
 *
 * Dimensions are responsive and clamped within map boundaries across desktop,
 * tablet/iPad, mobile, and narrow viewports.
 */
export function StoryBubble({
  storyKey,
  story,
  meta,
  totalStories,
  storyIndex,
  onNextStory,
  onPrevStory,
  size = "desktop",
  tail = "left",
  flipVertical = false,
  className,
  width,
  height,
  onClose,
}: {
  storyKey: string;
  story: string;
  meta?: string;
  totalStories?: number;
  storyIndex?: number;
  onNextStory?: () => void;
  onPrevStory?: () => void;
  size?: "desktop" | "mobile" | "small" | "compact" | "tiny";
  tail?: "left" | "right";
  flipVertical?: boolean;
  className?: string;
  width?: number;
  height?: number;
  onClose?: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();

  const defaultDims =
    size === "desktop"
      ? { width: 540, height: 225 }
      : size === "small"
        ? { width: 440, height: 205 }
        : size === "compact"
          ? { width: 360, height: 190 }
          : size === "mobile"
            ? { width: 330, height: 180 }
            : { width: 290, height: 170 }; // tiny / narrow

  const dims = {
    width: width ?? defaultDims.width,
    height: height ?? defaultDims.height,
  };

  // When tail is "left", mirror horizontally so the pointed tail is on the left
  const mirrored = tail === "left";

  // Comic polygon paths with angled facets and pointed speech tail (viewBox 0 0 400 200)
  // Tail is at x=335 (83.75% from left). When mirrored, it sits at x=65 (16.25% from left).
  const pathDown = "M14 14 L360 4 L398 40 L392 158 L345 158 L335 198 L310 158 L18 162 Z";
  const pathUp = "M14 186 L360 196 L398 160 L392 42 L345 42 L335 2 L310 42 L18 38 Z";

  return (
    <div
      className={`relative select-text ${className ?? ""}`}
      style={{ width: dims.width, height: dims.height }}
    >
      {/* SVG Comic-Book Polygon & Angular Speech Tail with Halftone Texture */}
      <svg
        viewBox="0 0 400 200"
        preserveAspectRatio="none"
        className={`absolute inset-0 h-full w-full pointer-events-none ${
          mirrored ? "-scale-x-100" : ""
        }`}
        style={{
          filter: "drop-shadow(0 10px 22px rgba(0, 0, 0, 0.42))",
        }}
        aria-hidden="true"
      >
        <defs>
          <pattern
            id={`comic-halftone-${storyKey}`}
            x="0"
            y="0"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="3" cy="3" r="0.85" fill="#000000" opacity="0.12" />
          </pattern>
        </defs>
        {/* Vibrant comic-book orange polygon */}
        <path d={flipVertical ? pathUp : pathDown} fill="#FF4B1F" />
        {/* Seamless printed comic halftone texture */}
        <path d={flipVertical ? pathUp : pathDown} fill={`url(#comic-halftone-${storyKey})`} />
      </svg>

      {/* Content Container constrained to non-tail portion of the comic cutout */}
      <AnimatePresence initial={false}>
        <motion.div
          key={storyKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0.05 : 0.12,
            ease: "easeOut",
          }}
          className={`absolute inset-x-2 sm:inset-x-3 z-10 flex flex-col justify-between overflow-hidden ${
            flipVertical
              ? "top-[22%] bottom-2.5 pt-0.5 pb-1 sm:pb-1.5"
              : "top-2.5 bottom-[22%] pt-1 sm:pt-1.5 pb-0.5"
          } ${
            size === "desktop"
              ? "px-6 md:px-7"
              : size === "small"
                ? "px-5"
                : size === "mobile"
                  ? "px-4"
                  : "px-3.5"
          }`}
        >
          {/* Top section: metadata header + multi-story navigation & close controls */}
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 shrink-0">
            {meta ? (
              <p
                className={`font-mono uppercase font-bold text-ink/85 truncate min-w-0 max-w-[calc(100%-80px)] sm:max-w-none ${
                  size === "desktop"
                    ? "text-[16px] md:text-[17px] tracking-[0.14em]"
                    : size === "small"
                      ? "text-[14px] sm:text-[15px] tracking-[0.11em]"
                      : size === "mobile"
                        ? "text-[12px] sm:text-[13px] tracking-[0.08em]"
                        : "text-[11px] sm:text-[12px] tracking-[0.06em]"
                }`}
              >
                {meta}
              </p>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
              {totalStories && totalStories > 1 ? (
                <div className="flex items-center gap-1 font-mono text-xs md:text-sm text-ink/75 font-bold">
                  <span className="tracking-wider">
                    {(storyIndex ?? 0) + 1}/{totalStories}
                  </span>
                  {onPrevStory && onNextStory ? (
                    <div className="flex items-center gap-0.5 ml-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPrevStory();
                        }}
                        aria-label="Previous story from this location"
                        className="flex size-5 sm:size-6 items-center justify-center rounded-full bg-black/10 hover:bg-black/25 text-ink transition-colors text-[10px] sm:text-xs font-bold leading-none cursor-pointer"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNextStory();
                        }}
                        aria-label="Next story from this location"
                        className="flex size-5 sm:size-6 items-center justify-center rounded-full bg-black/10 hover:bg-black/25 text-ink transition-colors text-[10px] sm:text-xs font-bold leading-none cursor-pointer"
                      >
                        ›
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {onClose ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  aria-label="Close story bubble"
                  className="flex size-6 sm:size-7 items-center justify-center rounded-full bg-black/10 hover:bg-black/25 text-ink transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
                >
                  <span className="text-sm font-black leading-none">&times;</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Story body text: readable, lighter editorial comic typography */}
          <div className="min-h-0 flex-1 flex flex-col justify-center py-0.5 sm:py-1 overflow-hidden">
            <p
              className={`font-body font-normal text-ink select-text text-left leading-[1.4] tracking-normal ${
                size === "desktop"
                  ? "text-[23px] line-clamp-3 sm:line-clamp-4"
                  : size === "small"
                    ? "text-[20px] line-clamp-3 sm:line-clamp-4"
                    : size === "compact"
                      ? "text-[18px] line-clamp-3"
                      : size === "mobile"
                        ? "text-[17px] line-clamp-3"
                        : "text-[15px] line-clamp-3"
              }`}
            >
              {story}
            </p>
          </div>

          {/* Bottom section: read the stories action link with dedicated visibility */}
          {story ? (
            <div className="shrink-0 flex items-center justify-start pt-0.5 pb-0.5">
              <a
                href="/archive"
                className="inline-flex items-center gap-1 font-mono text-[11px] sm:text-[12px] md:text-[13px] uppercase tracking-[0.18em] font-extrabold text-ink/90 hover:text-ink underline decoration-ink/40 hover:decoration-ink underline-offset-4 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
              >
                READ THE STORIES &rarr;
              </a>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
