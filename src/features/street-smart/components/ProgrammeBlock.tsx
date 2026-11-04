import { motion } from "motion/react";
import { Reveal } from "@/components/ui/Reveal";
import { moodyNightStreet } from "@/assets/local";
import { WALK_REGISTRATION_URL } from "@/features/street-smart/data/events";

const programmeDetails = ["2 hours", "10–15 people", "Walk in pairs"];

export function ProgrammeBlock() {
  function handleScrollToPast(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = document.getElementById("previous-event-posters");
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <section className="relative border-b border-paper/10 bg-ink text-paper">
      <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 md:min-h-[640px] md:grid-cols-2 lg:min-h-[720px]">
        {/* Left side — programme information */}
        <div className="flex flex-col justify-center px-6 py-12 sm:px-10 sm:py-16 md:px-10 md:py-20 lg:py-24 lg:pl-[max(2rem,calc((100vw-1400px)/2+2rem))] lg:pr-12 xl:pr-16">
          <div className="max-w-xl">
            {/* Eyebrow */}
            <Reveal>
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-paper/60 sm:text-xs">
                A TEXT WHEN YOU GET HOME PROGRAMME
              </p>
            </Reveal>

            {/* Heading split onto two lines */}
            <Reveal delay={0.08}>
              <h1
                aria-label="Walks & Workshops"
                className="mt-4 overflow-visible font-display italic leading-[0.88] tracking-[-0.03em] text-highlight [font-size:clamp(2.5rem,5.8vw,5.25rem)] sm:mt-6"
              >
                <span className="block">WALKS &amp;</span>
                <span className="block">WORKSHOPS</span>
              </h1>
            </Reveal>

            {/* Description */}
            <Reveal delay={0.16}>
              <p className="mt-6 text-lg font-light leading-relaxed text-paper/90 sm:mt-8 sm:text-xl md:text-2xl">
                We walk together to notice what the city quietly asks us to ignore.
              </p>
            </Reveal>

            {/* Programme details pills (removed ₹199) */}
            <Reveal delay={0.24}>
              <div className="mt-8 flex flex-wrap items-center gap-2.5 sm:mt-10 sm:gap-3">
                {programmeDetails.map((detail) => (
                  <div
                    key={detail}
                    className="flex items-center rounded-full border border-paper/20 bg-paper/[0.04] px-4 py-1.5 font-mono text-xs text-paper/75 sm:px-5 sm:py-2 sm:text-sm"
                  >
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Action buttons */}
            <Reveal delay={0.32}>
              <div className="mt-10 flex flex-wrap items-center gap-4 sm:mt-12 sm:gap-5">
                <motion.a
                  href={WALK_REGISTRATION_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -2, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-highlight px-8 py-3.5 text-sm font-bold text-ink shadow-md transition-colors hover:bg-highlight/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight sm:text-base sm:px-9 sm:py-4"
                >
                  Join the next walk
                </motion.a>

                <motion.a
                  href="#previous-event-posters"
                  onClick={handleScrollToPast}
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-paper/40 bg-transparent px-8 py-3.5 text-sm font-semibold text-paper transition-colors hover:border-paper hover:bg-paper/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper sm:text-base sm:px-9 sm:py-4"
                >
                  See past walks
                </motion.a>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Right side — street photograph */}
        <figure className="relative min-h-[340px] w-full overflow-hidden sm:min-h-[420px] md:min-h-full">
          <img
            src={moodyNightStreet.url}
            alt="Moody city street at night with parked cars, leafy trees, and warm streetlights"
            width={1024}
            height={416}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[62%_center] brightness-[0.82]"
          />
          {/* Subtle dark overlay */}
          <div className="pointer-events-none absolute inset-0 bg-ink/15" />

          {/* Seamless blend gradient on desktop/tablet (left edge) */}
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-28 bg-gradient-to-r from-ink to-transparent md:block lg:w-40" />

          {/* Seamless blend gradient on mobile (top edge) */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-ink to-transparent md:hidden" />
        </figure>
      </div>
    </section>
  );
}
