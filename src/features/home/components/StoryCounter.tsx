import { animate, useInView, useReducedMotion } from "motion/react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";

import { LinkButton } from "@/components/ui/StreetButton";
import { FilterPill } from "@/components/ui/FilterPill";
import { Reveal } from "@/components/ui/Reveal";
import { StickyNote } from "@/components/ui/StickyNote";
import { filters, type FilterId } from "@/shared/filters";
import { storyCounter } from "@/shared/stories";

import { getApprovedStoryCount } from "@/lib/cms/archive";

const InteractiveWorldMap = lazy(() =>
  import("@/features/home/components/InteractiveWorldMap").then((m) => ({
    default: m.InteractiveWorldMap,
  })),
);

export function StoryCounter() {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const nearView = useInView(ref, { margin: "400px 0px 400px 0px" });
  const shouldReduceMotion = useReducedMotion();
  const [targetCount, setTargetCount] = useState(storyCounter.displayed);
  const [count, setCount] = useState(storyCounter.displayed);
  const [activeFilters, setActiveFilters] = useState<FilterId[]>([]);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);

  const wasInViewRef = useRef(false);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const prevTargetCountRef = useRef(targetCount);

  useEffect(() => {
    if (nearView) {
      setShouldLoadMap(true);
    }
  }, [nearView]);

  useEffect(() => {
    if (!nearView) return;
    let active = true;
    getApprovedStoryCount().then((totalCount) => {
      if (active && totalCount !== null && totalCount > 0) {
        setTargetCount(totalCount);
      }
    });
    return () => {
      active = false;
    };
  }, [nearView]);

  const countRef = useRef(count);
  useEffect(() => {
    countRef.current = count;
  }, [count]);

  useEffect(() => {
    if (inView) {
      if (!wasInViewRef.current) {
        wasInViewRef.current = true;
        prevTargetCountRef.current = targetCount;

        if (controlsRef.current) {
          controlsRef.current.stop();
          controlsRef.current = null;
        }

        if (shouldReduceMotion) {
          setCount(targetCount);
        } else {
          setCount(0);
          controlsRef.current = animate(0, targetCount, {
            duration: 1.0,
            ease: [0.22, 1, 0.36, 1],
            onUpdate: (v) => setCount(Math.round(v)),
          });
        }
      } else if (prevTargetCountRef.current !== targetCount) {
        prevTargetCountRef.current = targetCount;
        if (shouldReduceMotion) {
          setCount(targetCount);
        } else {
          if (controlsRef.current) {
            controlsRef.current.stop();
            controlsRef.current = null;
          }
          controlsRef.current = animate(countRef.current, targetCount, {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
            onUpdate: (v) => setCount(Math.round(v)),
          });
        }
      }
    } else {
      if (wasInViewRef.current) {
        wasInViewRef.current = false;
        if (controlsRef.current) {
          controlsRef.current.stop();
          controlsRef.current = null;
        }
      }
    }

    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    };
  }, [inView, targetCount, shouldReduceMotion]);

  function toggle(id: FilterId) {
    setActiveFilters((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }

  return (
    <section
      ref={ref}
      className="grain relative overflow-hidden bg-highlight px-4 py-12 text-ink sm:px-8 sm:py-20"
    >
      <div className="mx-auto grid w-full max-w-[1400px] items-start gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-4">
          <p className="font-display leading-none tracking-[-0.03em] [font-size:clamp(3rem,14vw,4.6rem)]">
            {count}
          </p>
          <p className="mt-3 max-w-xs font-display text-xl leading-tight sm:text-2xl">
            {storyCounter.subtitle}
          </p>
          <div className="mt-6">
            <LinkButton to="/archive">Read the stories</LinkButton>
          </div>

          <Reveal>
            <p className="mt-12 font-hand text-xl sm:text-2xl">
              filter the stories through the emerging themes
            </p>
          </Reveal>
          <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
            {filters.map((filter) => (
              <FilterPill
                key={filter.id}
                label={filter.label}
                active={activeFilters.includes(filter.id)}
                onClick={() => toggle(filter.id)}
              />
            ))}
          </div>
        </div>

        <div className="relative lg:col-span-8">
          <StickyNote color="pink" rotate={-6} className="relative z-10 mb-6 max-w-sm">
            <p className="font-hand text-lg italic leading-snug sm:text-xl">
              &ldquo;{storyCounter.pinnedNote}&rdquo;
            </p>
          </StickyNote>
          {shouldLoadMap ? (
            <Suspense
              fallback={
                <div
                  aria-hidden
                  className="aspect-[960/500] w-full rounded-2xl border-2 border-ink/10 bg-ink/5"
                />
              }
            >
              <InteractiveWorldMap activeFilters={activeFilters} />
            </Suspense>
          ) : (
            <div
              aria-hidden
              className="aspect-[960/500] w-full rounded-2xl border-2 border-ink/10 bg-ink/5"
            />
          )}
        </div>
      </div>
    </section>
  );
}
