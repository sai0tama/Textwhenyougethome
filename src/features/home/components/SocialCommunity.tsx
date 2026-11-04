import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { Reveal } from "@/components/ui/Reveal";
import { rotationFromId } from "@/components/ui/StickyNote";
import type { SocialPost } from "@/features/home/data/socialPosts";
import { getSocialPosts } from "@/features/home/client/socialQuery";
import type { CmsResult } from "@/lib/cms/types";

const AUTO_SPEED = 0.35; // px per frame — slow, editorial drift

export function SocialCommunity() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const inView = useInView(sectionRef, { margin: "600px 0px" });
  const [result, setResult] = useState<CmsResult<SocialPost> | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: 0 });
  const [paused, setPaused] = useState(false);
  const offsetRef = useRef(0);

  useEffect(() => {
    if (!inView) return;
    let active = true;
    getSocialPosts().then((res) => {
      if (active) setResult(res);
    });
    return () => {
      active = false;
    };
  }, [inView]);

  const posts = result?.status === "success" ? result.data : [];
  // the rail renders the posts twice so the loop can wrap seamlessly
  const loop = [...posts, ...posts];

  // horizontal mouse-wheel scrolling (non-passive so we can preventDefault)
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

  // continuous automatic drift, paused while the visitor interacts, offscreen, or reduced motion
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!inView || prefersReducedMotion) return;

    let frame = 0;
    // sub-pixel offsets get rounded away by the browser, so accumulate locally
    offsetRef.current = railRef.current?.scrollLeft ?? 0;
    function tick() {
      const el = railRef.current;
      if (el && !paused && !drag.current.active) {
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
  }, [inView, paused]);

  /** keep the visitor inside the first copy so the loop never hits an end */
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
    // pause the drift briefly, otherwise the animation frame overwrites the jump
    setPaused(true);
    const half = el.scrollWidth / 2;
    let target = el.scrollLeft + dir * (el.clientWidth * 0.6);
    if (target >= half) target -= half;
    if (target < 0) target += half;
    offsetRef.current = target;
    el.scrollTo({ left: target, behavior: "smooth" });
    window.setTimeout(() => setPaused(false), 700);
  }

  function renderContent() {
    if (!result) return null;

    if (result.status === "unconfigured") {
      return (
        <div className="mx-auto mt-8 w-full max-w-[1400px] py-12 text-center font-hand text-2xl text-ink/70">
          CMS not configured. Add VITE_WIX_CLIENT_ID to connect to Wix.
        </div>
      );
    }

    if (result.status === "error") {
      return (
        <div className="mx-auto mt-8 w-full max-w-[1400px] py-12 text-center font-hand text-2xl text-ink/70">
          {result.message}
        </div>
      );
    }

    if (result.status === "empty") {
      return (
        <div className="mx-auto mt-8 w-full max-w-[1400px] py-12 text-center font-hand text-2xl text-ink/70">
          No community posts yet.
        </div>
      );
    }

    return (
      <div
        ref={railRef}
        className="no-scrollbar mx-auto mt-8 flex w-full max-w-[1400px] cursor-grab gap-4 overflow-x-auto pb-8 sm:mt-10 sm:gap-6 active:cursor-grabbing"
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
        {loop.map((post, i) => (
          <a
            key={`${post.id}-${i}`}
            href={post.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-hidden={i >= posts.length}
            tabIndex={i >= posts.length ? -1 : 0}
            onClick={(e) => {
              if (drag.current.moved > 8) e.preventDefault();
            }}
            className="grain relative group w-[76vw] max-w-[340px] shrink-0 bg-paper-deep p-3 transition-transform duration-300 hover:-translate-y-[6px] physical-shadow sm:w-[340px]"
            style={{ transform: `rotate(${rotationFromId(post.id, 2.2)}deg)` }}
          >
            <div className="aspect-[4/5] w-full overflow-hidden bg-ink/85">
              <img
                src={post.image}
                alt={post.title}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </div>
            <p className="mt-4 font-display text-lg leading-tight text-ink">{post.title}</p>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.2em] text-ink/60">
              {post.platform} · {post.date}
            </p>
          </a>
        ))}
      </div>
    );
  }

  return (
    <section ref={sectionRef} className="paper-texture overflow-hidden px-4 pb-16 sm:px-8 sm:pb-24">
      <div className="mx-auto w-full max-w-[1400px]">
        <Reveal>
          <h2 className="font-display leading-none tracking-tight text-ink [font-size:clamp(1.75rem,7vw,3rem)]">
            From the social community
          </h2>
        </Reveal>
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="font-hand text-xl text-ink/70 sm:text-2xl">drag the rail →</p>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous posts"
              onClick={() => step(-1)}
              className="flex size-11 items-center justify-center rounded-full border-2 border-ink font-mono text-xs text-ink transition-transform hover:-translate-y-0.5 hover:bg-highlight"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Next posts"
              onClick={() => step(1)}
              className="flex size-11 items-center justify-center rounded-full border-2 border-ink font-mono text-xs text-ink transition-transform hover:-translate-y-0.5 hover:bg-highlight"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {renderContent()}
    </section>
  );
}
