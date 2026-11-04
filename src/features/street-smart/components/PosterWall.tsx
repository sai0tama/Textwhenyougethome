import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { Reveal } from "@/components/ui/Reveal";
import { rotationFromId } from "@/components/ui/StickyNote";
import type { PastEvent } from "@/features/street-smart/data/events";
import { getPastEvents } from "@/features/street-smart/client/eventsQuery";
import type { CmsResult } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

const AUTO_SPEED = 0.35; // px per frame — slow editorial drift

export function PosterWall() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const inView = useInView(sectionRef, { margin: "300px 0px" });
  const [result, setResult] = useState<CmsResult<PastEvent> | null>(null);
  const [open, setOpen] = useState<PastEvent | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: 0 });
  const [paused, setPaused] = useState(false);
  const offsetRef = useRef(0);

  useEffect(() => {
    let active = true;
    getPastEvents().then((res) => {
      if (active) setResult(res);
    });
    return () => {
      active = false;
    };
  }, []);

  // Escape closes the lightbox modal
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const events = result?.status === "success" ? result.data : [];
  // Loop array twice for seamless continuous scrolling
  const loopEvents = [...events, ...events];

  // Mouse wheel horizontal scrolling
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (!el) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Continuous subtle automatic drift, paused during interaction, offscreen, or reduced motion
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!inView || prefersReducedMotion) return;

    let frame = 0;
    offsetRef.current = railRef.current?.scrollLeft ?? 0;
    function tick() {
      const el = railRef.current;
      if (el && !paused && !drag.current.active && loopEvents.length > 0) {
        const half = el.scrollWidth / 2;
        offsetRef.current += AUTO_SPEED;
        if (offsetRef.current >= half) offsetRef.current -= half;
        el.scrollLeft = offsetRef.current;
      } else if (el) {
        offsetRef.current = el.scrollLeft;
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, paused, loopEvents.length]);

  function normalise() {
    const el = railRef.current;
    if (!el) return;
    const half = el.scrollWidth / 2;
    if (el.scrollLeft >= half) el.scrollLeft -= half;
    else if (el.scrollLeft < 0) el.scrollLeft += half;
  }

  function step(dir: 1 | -1) {
    const el = railRef.current;
    if (!el) return;
    setPaused(true);
    const half = el.scrollWidth / 2;
    let target = el.scrollLeft + dir * (el.clientWidth * 0.65);
    if (target >= half) target -= half;
    if (target < 0) target += half;
    offsetRef.current = target;
    el.scrollTo({ left: target, behavior: "smooth" });
    window.setTimeout(() => setPaused(false), 700);
  }

  function renderPosters() {
    if (!result) return null;

    if (result.status === "unconfigured") {
      return (
        <div className="mt-8 py-12 text-center font-hand text-2xl text-paper/70">
          CMS not configured. Add VITE_WIX_CLIENT_ID to connect to Wix.
        </div>
      );
    }

    if (result.status === "error") {
      return (
        <div className="mt-8 py-12 text-center font-hand text-2xl text-paper/70">
          {result.message}
        </div>
      );
    }

    if (result.status === "empty") {
      return (
        <div className="mt-8 py-12 text-center font-hand text-2xl text-paper/70">
          No past event posters available.
        </div>
      );
    }

    return (
      <div
        ref={railRef}
        className="no-scrollbar mt-6 flex cursor-grab gap-5 overflow-x-auto pb-8 pt-2 active:cursor-grabbing sm:mt-8 sm:gap-8"
        onScroll={normalise}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        onPointerDown={(e) => {
          const el = railRef.current;
          if (!el) return;
          setPaused(true);
          drag.current = { active: true, startX: e.clientX, scrollLeft: el.scrollLeft, moved: 0 };
        }}
        onPointerMove={(e) => {
          const el = railRef.current;
          if (!el || !drag.current.active) return;
          const dx = e.clientX - drag.current.startX;
          drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
          el.scrollLeft = drag.current.scrollLeft - dx;
        }}
        onPointerUp={() => {
          drag.current.active = false;
        }}
        onPointerLeave={() => {
          drag.current.active = false;
        }}
      >
        {loopEvents.map((event, i) => (
          <button
            key={`${event.id}-${i}`}
            type="button"
            aria-hidden={i >= events.length}
            tabIndex={i >= events.length ? -1 : 0}
            onClick={(e) => {
              if (drag.current.moved > 8) {
                e.preventDefault();
                return;
              }
              setOpen(event);
            }}
            aria-label={`${event.title} poster`}
            className="grain relative group w-[76vw] max-w-[300px] shrink-0 bg-paper-deep p-3 text-left physical-shadow transition-transform duration-300 hover:-translate-y-[6px] sm:w-[300px]"
            style={{ transform: `rotate(${rotationFromId(event.id, 2.0)}deg)` }}
          >
            <div className="aspect-[3/4] w-full overflow-hidden bg-ink">
              <img
                src={event.image}
                alt={`${event.title} poster`}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </div>
            <p className="mt-3 font-display text-base leading-tight text-ink">{event.title}</p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-ink/60">
              {event.caption}
            </p>
          </button>
        ))}
      </div>
    );
  }

  return (
    <section
      id="previous-event-posters"
      ref={sectionRef}
      className="bg-ink px-4 pb-16 pt-6 sm:px-8 sm:pb-24 sm:pt-10 scroll-mt-12"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        {/* Eyebrow label, drag hint & arrow controls */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <Reveal>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/50">
                PREVIOUS EVENT POSTERS
              </p>
            </Reveal>
            <p className="font-hand text-lg text-paper/60 sm:text-xl">drag the rail →</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous posters"
              onClick={() => step(-1)}
              className="flex size-10 items-center justify-center rounded-full border-2 border-paper/40 font-mono text-xs text-paper transition-all hover:-translate-y-0.5 hover:border-highlight hover:bg-highlight hover:text-ink sm:size-11"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Next posters"
              onClick={() => step(1)}
              className="flex size-10 items-center justify-center rounded-full border-2 border-paper/40 font-mono text-xs text-paper transition-all hover:-translate-y-0.5 hover:border-highlight hover:bg-highlight hover:text-ink sm:size-11"
            >
              →
            </button>
          </div>
        </div>

        {/* 4. Horizontal Poster Rail */}
        {renderPosters()}
      </div>

      {/* Enlarged Poster Lightbox Modal */}
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/90 p-4"
            onClick={() => setOpen(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`${open.title} poster`}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 28 }}
              className="grain relative max-h-[88vh] w-full max-w-[520px] overflow-y-auto bg-paper-deep p-3 sm:p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={open.image}
                alt={`${open.title} poster, enlarged`}
                decoding="async"
                className="mx-auto max-h-[62vh] w-full object-contain"
              />
              {open.whatWeLearned ? (
                <div className="mt-4">
                  <h4 className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-ink/60">
                    WHAT WE LEARNED
                  </h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink/85 sm:text-sm sm:leading-relaxed">
                    {open.whatWeLearned}
                  </p>
                </div>
              ) : null}

              <div
                className={cn(
                  "flex items-start justify-between gap-3 sm:gap-4",
                  open.whatWeLearned
                    ? "mt-4 border-t border-ink/15 pt-3.5 sm:mt-5 sm:pt-4"
                    : "mt-4",
                )}
              >
                <div className="min-w-0">
                  <p className="font-display text-lg leading-tight text-ink sm:text-xl">
                    {open.title}
                  </p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-ink/60">
                    {open.caption}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  className="inline-flex min-h-[40px] shrink-0 items-center rounded-full bg-ink px-5 py-2 text-xs font-semibold text-paper transition-transform hover:-translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                  aria-label="Close poster details"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
