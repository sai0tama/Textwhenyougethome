import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchArchiveStatistics,
  type ArchiveStatistics,
} from "@/features/home/client/statisticsClient";

interface StatConfig {
  id: "stories" | "cities" | "walks" | "themes";
  target: number | null;
  suffix?: string;
  label: string;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

const REFRESH_INTERVAL_MS = 60 * 1000; // 60 seconds

export function HorizontalStatisticsBar({
  initialStats,
}: {
  initialStats?: ArchiveStatistics | null;
}) {
  const [stats, setStats] = useState<ArchiveStatistics | null>(initialStats ?? null);
  const [hasFailedInitialFetch, setHasFailedInitialFetch] = useState(false);

  const sectionRef = useRef<HTMLElement | null>(null);
  const numbersRef = useRef<(HTMLSpanElement | null)[]>([]);
  const isInViewRef = useRef(false);
  const hasAnimatedRef = useRef(false);
  const currentValuesRef = useRef<number[]>([0, 0, 0, 0]);
  const rafIdRef = useRef<number | null>(null);
  const isFetchingRef = useRef(false);

  // Configure dynamic statistics based on current live data
  const statItems: StatConfig[] = useMemo(
    () => [
      {
        id: "stories",
        target: stats?.storiesCount ?? null,
        suffix: "+",
        label: "stories collected",
      },
      {
        id: "cities",
        target: stats?.citiesCount ?? null,
        suffix: "+",
        label: "cities, from Bengaluru to Manila",
      },
      {
        id: "walks",
        target: stats?.walksCount ?? null,
        label: "walks and workshops since Aug 2025",
      },
      {
        id: "themes",
        target: stats?.themesCount ?? null,
        label: "themes the stories fall into",
      },
    ],
    [stats?.citiesCount, stats?.storiesCount, stats?.themesCount, stats?.walksCount],
  );

  // 1. Data Fetching & Periodic Refresh Lifecycle
  useEffect(() => {
    let active = true;

    async function loadStats() {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        const response = await fetchArchiveStatistics();
        if (!active) return;

        if (response.status === "success" && response.data) {
          setStats(response.data);
          setHasFailedInitialFetch(false);
        } else if (!stats) {
          setHasFailedInitialFetch(true);
        }
      } catch (err) {
        if (!active) return;
        console.warn("Background statistics refresh failed:", err);
        if (!stats) {
          setHasFailedInitialFetch(true);
        }
      } finally {
        isFetchingRef.current = false;
      }
    }

    // Initial fetch if initialStats was not provided
    if (!initialStats) {
      loadStats();
    }

    // Setup periodic 60s auto-refresh
    const intervalId = setInterval(loadStats, REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [initialStats, stats]);

  // 2. Count-Up Animation & Viewport Tracking
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Helper: update DOM span text
    function updateSpan(index: number, val: number | null, suffix?: string) {
      const span = numbersRef.current[index];
      if (!span) return;
      if (val === null) {
        span.textContent = hasFailedInitialFetch ? "—" : "—";
      } else {
        span.textContent = `${val}${suffix ?? ""}`;
      }
    }

    // If reduced motion is preferred, render values immediately without animation
    if (prefersReducedMotion) {
      statItems.forEach((stat, i) => {
        updateSpan(i, stat.target, stat.suffix);
        if (stat.target !== null) {
          currentValuesRef.current[i] = stat.target;
        }
      });
      hasAnimatedRef.current = true;
      return;
    }

    // Animate numbers
    function runAnimation(duration = 1200, stagger = 100) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      const startValues = [...currentValuesRef.current];
      const targetValues = statItems.map((s) => s.target);
      const startTime = performance.now();

      function tick(now: number) {
        let allDone = true;

        statItems.forEach((stat, i) => {
          const target = targetValues[i];
          if (target === null || target === undefined) {
            updateSpan(i, null, stat.suffix);
            return;
          }

          const startVal = startValues[i] ?? 0;
          if (startVal === target) {
            updateSpan(i, target, stat.suffix);
            return;
          }

          const itemStart = startTime + i * stagger;
          const elapsed = now - itemStart;

          if (elapsed < 0) {
            updateSpan(i, startVal, stat.suffix);
            allDone = false;
            return;
          }

          const progress = Math.min(1, elapsed / duration);
          if (progress < 1) {
            allDone = false;
            const eased = easeOutCubic(progress);
            const currentVal = Math.round(startVal + (target - startVal) * eased);
            currentValuesRef.current[i] = currentVal;
            updateSpan(i, currentVal, stat.suffix);
          } else {
            currentValuesRef.current[i] = target;
            updateSpan(i, target, stat.suffix);
          }
        });

        if (!allDone) {
          rafIdRef.current = requestAnimationFrame(tick);
        } else {
          rafIdRef.current = null;
        }
      }

      rafIdRef.current = requestAnimationFrame(tick);
    }

    // If already in view, trigger appropriate transition
    if (isInViewRef.current) {
      if (!hasAnimatedRef.current) {
        // Initial viewport entrance: roll up from 0 to targets
        hasAnimatedRef.current = true;
        runAnimation(1300, 100);
      } else {
        // Subsequent background refresh: smoothly adjust values without resetting to 0
        runAnimation(500, 0);
      }
      return;
    }

    // IntersectionObserver to trigger animation when section enters viewport
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          isInViewRef.current = true;
          if (!hasAnimatedRef.current) {
            hasAnimatedRef.current = true;
            runAnimation(1300, 100);
          } else {
            // Already animated previously; ensure displayed numbers match targets
            statItems.forEach((stat, i) => {
              updateSpan(i, stat.target, stat.suffix);
            });
          }
        } else {
          isInViewRef.current = false;
        }
      },
      {
        threshold: 0.2,
      },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [hasFailedInitialFetch, statItems]);

  return (
    <section
      ref={sectionRef}
      aria-label="Archive live statistics"
      className="border-y border-paper/15 bg-ink text-paper"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="grid grid-cols-1 divide-y divide-paper/15 sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
          {statItems.map((stat, index) => (
            <div
              key={stat.id}
              className="flex flex-col justify-center px-6 py-8 sm:px-8 sm:py-10 lg:px-8 lg:py-12"
            >
              <span
                ref={(node) => {
                  numbersRef.current[index] = node;
                }}
                className={`font-display text-4xl font-bold tracking-tight text-highlight tabular-nums sm:text-5xl lg:text-6xl ${
                  stat.target === null && !hasFailedInitialFetch ? "opacity-60 animate-pulse" : ""
                }`}
                aria-live="polite"
              >
                {stat.target !== null ? `${stat.target}${stat.suffix ?? ""}` : "—"}
              </span>
              <p className="mt-2 text-xs uppercase tracking-wider text-paper/60 sm:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
