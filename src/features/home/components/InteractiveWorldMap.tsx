import { geoPath, type GeoPermissibleObjects } from "d3-geo";
import { geoNaturalEarth1 } from "d3-geo";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { feature } from "topojson-client";

import { StoryBubble } from "@/components/ui/StoryBubble";
import { useMapInteraction } from "@/features/home/hooks/useMapInteraction";
import {
  buildCityStoryIndex,
  CANONICAL_PROJECTED_CITIES,
  computeBubbleLayout,
  filterProjectedCities,
  MAP_HEIGHT,
  MAP_WIDTH,
  resolveActiveStory,
  type ProjectedCityPoint,
} from "@/features/home/utils/mapData";
import type { ArchiveNote } from "@/features/submissions/client/localNoteStorage";
import { getApprovedMapStories } from "@/lib/cms/archive";
import type { FilterId } from "@/shared/filters";

const DOT_STEP = 9;

type Dot = { x: number; y: number };

// Global module-level cache for halftone land dots
let cachedDots: Dot[] | null = null;
let fetchPromise: Promise<Dot[]> | null = null;
let baseCanvasCache: HTMLCanvasElement | null = null;

const projection = geoNaturalEarth1()
  .scale(165)
  .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2 + 10]);

function rasteriseLand(land: GeoPermissibleObjects): Dot[] {
  const canvas = document.createElement("canvas");
  canvas.width = MAP_WIDTH;
  canvas.height = MAP_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];

  ctx.fillStyle = "#000";
  const path = geoPath(projection, ctx);
  ctx.beginPath();
  path(land);
  ctx.fill();

  const { data } = ctx.getImageData(0, 0, MAP_WIDTH, MAP_HEIGHT);
  const dots: Dot[] = [];
  for (let y = 4; y < MAP_HEIGHT; y += DOT_STEP) {
    for (let x = 4; x < MAP_WIDTH; x += DOT_STEP) {
      if ((data[(y * MAP_WIDTH + x) * 4 + 3] ?? 0) > 128) {
        dots.push({ x, y });
      }
    }
  }
  return dots;
}

function renderBaseCanvas(dotList: Dot[]): HTMLCanvasElement {
  if (
    baseCanvasCache &&
    baseCanvasCache.width === MAP_WIDTH &&
    baseCanvasCache.height === MAP_HEIGHT
  ) {
    return baseCanvasCache;
  }
  const canvas = document.createElement("canvas");
  canvas.width = MAP_WIDTH;
  canvas.height = MAP_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = "#686868";
  for (let i = 0; i < dotList.length; i++) {
    const dot = dotList[i];
    if (!dot) continue;
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, 1.15, 0, Math.PI * 2);
    ctx.fill();
  }
  baseCanvasCache = canvas;
  return canvas;
}

export function InteractiveWorldMap({ activeFilters = [] }: { activeFilters?: FilterId[] }) {
  const shouldReduceMotion = useReducedMotion();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [dots, setDots] = useState<Dot[]>(() => cachedDots ?? []);
  const [mapStories, setMapStories] = useState<ArchiveNote[]>([]);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [storyOffset, setStoryOffset] = useState(0);

  // Load approved stories from CMS once on mount
  useEffect(() => {
    let active = true;
    getApprovedMapStories().then((res) => {
      if (active && res.status === "success") {
        setMapStories(res.data);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Fetch basemap land TopoJSON with caching
  useEffect(() => {
    if (cachedDots && cachedDots.length > 0) {
      setDots(cachedDots);
      return;
    }

    let active = true;
    if (!fetchPromise) {
      fetchPromise = fetch("/data/land-110m.json")
        .then((r) => r.json())
        .then((topo) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const land = feature(topo as any, (topo as any).objects.land) as GeoPermissibleObjects;
          const computed = rasteriseLand(land);
          cachedDots = computed;
          return computed;
        })
        .catch((err) => {
          console.warn("Failed to load map topology:", err);
          return [];
        });
    }

    fetchPromise.then((computedDots) => {
      if (active) {
        setDots(computedDots);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  // Static canvas: drawn once when dots are loaded, 0% CPU on mousemove
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dots.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const base = renderBaseCanvas(dots);
    ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    ctx.drawImage(base, 0, 0);
  }, [dots]);

  // Track map container dimensions via ResizeObserver
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;

    const update = (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerDimensions((prev) => {
          if (Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5) {
            return prev;
          }
          return { width, height };
        });
      }
    };

    const ro = new ResizeObserver(update);
    ro.observe(el);

    // Initial measure
    const rect = el.getBoundingClientRect();
    setContainerDimensions({ width: rect.width, height: rect.height });

    return () => {
      ro.disconnect();
    };
  }, []);

  // Memoized points filtered by active tags
  const points = useMemo(() => {
    return filterProjectedCities(CANONICAL_PROJECTED_CITIES, activeFilters);
  }, [activeFilters]);

  // Stable index of CMS stories
  const storyIndex = useMemo(() => {
    return buildCityStoryIndex(mapStories);
  }, [mapStories]);

  // Interaction controller hook
  const {
    activeMarkerId,
    nearestMarkerId,
    isPinned,
    screenReaderAnnouncement,
    dismiss,
    isOverBubbleRef,
    setBubbleLayout,
    handlers,
  } = useMapInteraction({
    points,
    containerRef: mapContainerRef,
  });

  // Reset multi-story index when active marker changes
  useEffect(() => {
    setStoryOffset(0);
  }, [activeMarkerId]);

  const activePoint = useMemo(() => {
    if (!activeMarkerId) return null;
    return points.find((p) => p.city.id === activeMarkerId) ?? null;
  }, [activeMarkerId, points]);

  const activeStoryData = useMemo(() => {
    if (!activePoint) return null;
    return resolveActiveStory(activePoint.city, storyIndex, storyOffset);
  }, [activePoint, storyIndex, storyOffset]);

  const bubbleLayout = useMemo(() => {
    if (!activePoint) return null;
    return computeBubbleLayout(activePoint, containerDimensions.width, containerDimensions.height);
  }, [activePoint, containerDimensions.width, containerDimensions.height]);

  useEffect(() => {
    setBubbleLayout(bubbleLayout);
  }, [bubbleLayout, setBubbleLayout]);

  return (
    <div className="w-full text-paper">
      <div className="relative w-full">
        {/* Screen reader live region for non-visual assistive announcements */}
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {screenReaderAnnouncement}
        </div>

        {/* Responsive map container */}
        <div
          ref={mapContainerRef}
          role="region"
          aria-label="Interactive world map of community stories"
          className="relative aspect-[16/10] sm:aspect-[2.1/1] lg:aspect-[2.35/1] w-full select-none overflow-hidden rounded-[18px] border border-paper/15 bg-ink sm:rounded-[26px]"
          onPointerMove={handlers.onPointerMove}
          onPointerLeave={handlers.onPointerLeave}
          onPointerDown={handlers.onPointerDown}
          onPointerUp={handlers.onPointerUp}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[role="button"]') && !target.closest(".story-bubble-container")) {
              dismiss();
            }
          }}
          style={{ touchAction: "pan-y" }}
        >
          {/* Static Canvas basemap for continent halftone dots */}
          <canvas
            ref={canvasRef}
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            className="pointer-events-none absolute inset-0 h-full w-full object-fill"
            aria-hidden="true"
          />

          {/* SVG Marker and Interaction Layer */}
          <svg
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            {/* Interactive location markers */}
            {points.map((point) => {
              const isActive = point.city.id === activeMarkerId;
              const isNearby = !activeMarkerId && point.city.id === nearestMarkerId;

              return (
                <g
                  key={point.city.id}
                  data-marker-id={point.city.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${point.city.name}, ${point.city.country}: Read story`}
                  aria-expanded={isActive}
                  className="cursor-pointer focus-visible:outline-none"
                  onClick={(e) => handlers.onMarkerClick(point.city.id, e)}
                  onKeyDown={(e) => handlers.onMarkerKeyDown(point.city.id, e)}
                  onFocus={() => handlers.onMarkerFocus(point.city.id)}
                >
                  {/* Invisible enlarged hit target for desktop and touch */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={16}
                    fill="transparent"
                    className="cursor-pointer"
                  />

                  {/* Active expanding pulse ring when motion is allowed */}
                  {isActive && !shouldReduceMotion ? (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={9}
                      fill="none"
                      stroke="var(--highlight)"
                      strokeWidth={1.2}
                      className="animate-ping opacity-50"
                      style={{
                        transformOrigin: `${point.x}px ${point.y}px`,
                      }}
                    />
                  ) : null}

                  {/* Keyboard focus / active state outer ring: ONLY on active marker */}
                  {isActive ? (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={8}
                      fill="none"
                      stroke="var(--highlight)"
                      strokeWidth={1.5}
                      className="opacity-100 transition-opacity duration-150"
                    />
                  ) : null}

                  {/* Core visual marker dot: only active marker glows */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isActive ? 5.5 : isNearby ? 4.5 : 3.5}
                    fill="var(--highlight)"
                    className="transition-all duration-150 ease-out"
                    style={{
                      filter: isActive ? "drop-shadow(0 0 8px rgba(239, 254, 9, 0.95))" : undefined,
                      opacity: isActive ? 1 : isNearby ? 1 : 0.85,
                    }}
                  />
                </g>
              );
            })}

            {/* Active marker label and highlight overlay */}
            {activePoint ? (
              <g className="pointer-events-none" aria-hidden="true">
                <text
                  x={activePoint.x > MAP_WIDTH - 90 ? activePoint.x - 12 : activePoint.x + 12}
                  y={activePoint.y + 4}
                  textAnchor={activePoint.x > MAP_WIDTH - 90 ? "end" : "start"}
                  fill="var(--highlight)"
                  fontSize={12}
                  fontWeight="600"
                  fontFamily="var(--font-mono)"
                  className="select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]"
                >
                  {activePoint.city.name}
                  {isPinned ? " •" : ""}
                </text>
              </g>
            ) : null}
          </svg>

          {/* Anchored Story Bubble Overlay */}
          <AnimatePresence>
            {activeMarkerId && activeStoryData && bubbleLayout ? (
              <motion.div
                key={`bubble-${activeMarkerId}`}
                initial={{
                  opacity: 0,
                  y: shouldReduceMotion ? 0 : bubbleLayout.flipVertical ? -6 : 6,
                  scale: shouldReduceMotion ? 1 : 0.98,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  pointerEvents: "none",
                  y: shouldReduceMotion ? 0 : bubbleLayout.flipVertical ? -4 : 4,
                  scale: shouldReduceMotion ? 1 : 0.98,
                }}
                transition={{
                  duration: shouldReduceMotion ? 0.05 : 0.14,
                  ease: "easeOut",
                }}
                className="story-bubble-container pointer-events-auto absolute z-30 select-text"
                style={{
                  left: `${bubbleLayout.left}px`,
                  top: `${bubbleLayout.top}px`,
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseEnter={() => {
                  isOverBubbleRef.current = true;
                }}
                onMouseLeave={() => {
                  isOverBubbleRef.current = false;
                }}
              >
                <StoryBubble
                  storyKey={`${activeMarkerId}-${activeStoryData.id ?? storyOffset}`}
                  story={activeStoryData.story}
                  meta={activeStoryData.meta}
                  totalStories={activeStoryData.totalStories}
                  storyIndex={activeStoryData.storyIndex}
                  onNextStory={() => setStoryOffset((prev) => prev + 1)}
                  onPrevStory={() =>
                    setStoryOffset((prev) =>
                      prev - 1 < 0 ? (activeStoryData.totalStories ?? 1) - 1 : prev - 1,
                    )
                  }
                  size={bubbleLayout.size}
                  width={bubbleLayout.width}
                  height={bubbleLayout.height}
                  tail={bubbleLayout.tail}
                  flipVertical={bubbleLayout.flipVertical}
                  onClose={dismiss}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
