import { useInView } from "motion/react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";

const InteractiveWorldMap = lazy(() =>
  import("@/features/home/components/InteractiveWorldMap").then((m) => ({
    default: m.InteractiveWorldMap,
  })),
);

export function InteractiveWorldMapSection() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nearView = useInView(containerRef, { margin: "400px 0px 400px 0px" });
  const [shouldLoadMap, setShouldLoadMap] = useState(false);

  useEffect(() => {
    if (nearView) {
      setShouldLoadMap(true);
    }
  }, [nearView]);

  return (
    <section
      ref={containerRef}
      aria-label="Interactive stories world map"
      className="bg-highlight px-4 py-8 sm:px-8 sm:py-10 md:py-12"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        {/* Large near-black container with rounded corners and responsive aspect ratio */}
        <div className="overflow-hidden rounded-[20px] border border-ink/20 bg-ink p-1.5 shadow-xl sm:rounded-[28px] sm:p-2 md:p-3">
          {shouldLoadMap ? (
            <Suspense
              fallback={
                <div
                  aria-hidden
                  className="aspect-[16/10] sm:aspect-[2.1/1] lg:aspect-[2.35/1] w-full rounded-2xl border border-paper/10 bg-ink animate-pulse"
                />
              }
            >
              <InteractiveWorldMap />
            </Suspense>
          ) : (
            <div
              aria-hidden
              className="aspect-[16/10] sm:aspect-[2.1/1] lg:aspect-[2.35/1] w-full rounded-2xl border border-paper/10 bg-ink"
            />
          )}
        </div>

        {/* Instruction directly beneath the map on the neon-yellow background */}
        <p className="mt-4 text-center font-hand text-2xl text-ink sm:mt-5 sm:text-3xl">
          <span className="hidden sm:inline">Move across the map to discover stories &rarr;</span>
          <span className="sm:hidden">Tap any marker to explore stories &rarr;</span>
        </p>
      </div>
    </section>
  );
}
