import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { Reveal } from "@/components/ui/Reveal";
import type { UpcomingWalk } from "@/features/street-smart/data/events";
import { getUpcomingEvents } from "@/features/street-smart/client/eventsQuery";
import type { CmsResult } from "@/lib/cms/types";

export function UpcomingWalks() {
  const [result, setResult] = useState<CmsResult<UpcomingWalk> | null>(null);

  useEffect(() => {
    let active = true;
    getUpcomingEvents().then((res) => {
      if (active) setResult(res);
    });
    return () => {
      active = false;
    };
  }, []);

  function renderContent() {
    if (!result) return null;

    if (result.status === "unconfigured") {
      return (
        <div className="mt-8 border-t border-paper/20 py-12 text-center text-paper/70 font-hand text-2xl">
          CMS not configured. Add VITE_WIX_CLIENT_ID to connect to Wix.
        </div>
      );
    }

    if (result.status === "error") {
      return (
        <div className="mt-8 border-t border-paper/20 py-12 text-center text-paper/70 font-hand text-2xl">
          {result.message}
        </div>
      );
    }

    if (result.status === "empty") {
      return (
        <div className="mt-8 border-t border-paper/20 py-12 text-center text-paper/70 font-hand text-2xl">
          No upcoming walks right now. Check back soon.
        </div>
      );
    }

    const walks = result.data;
    return (
      <ul className="mt-8 border-t border-paper/15 sm:mt-12">
        {walks.map((walk, i) => (
          <Reveal as="li" key={walk.id} delay={i * 0.1}>
            <div className="flex flex-col gap-3 border-b border-paper/15 py-5 transition-colors duration-200 hover:bg-paper/[0.03] sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-7">
              <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6 md:gap-10">
                <span className="shrink-0 font-display text-2xl tracking-tight text-highlight sm:min-w-[180px] sm:text-3xl md:min-w-[240px] md:text-4xl">
                  {walk.date}
                </span>
                <span className="min-w-0 text-base text-paper/85 sm:text-lg md:text-xl">
                  {walk.place} · {walk.city}
                </span>
              </div>
              <div className="flex shrink-0 justify-end">
                <motion.a
                  href={walk.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -2, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-highlight px-6 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-highlight/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight"
                >
                  Join
                </motion.a>
              </div>
            </div>
          </Reveal>
        ))}
      </ul>
    );
  }

  return (
    <section id="upcoming-walks" className="bg-ink px-4 py-14 text-paper sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-[1400px]">
        <Reveal>
          <h2 className="font-display leading-[0.95] tracking-tight [font-size:clamp(2rem,7vw,3.75rem)]">
            Upcoming Walks
          </h2>
        </Reveal>

        {renderContent()}
      </div>
    </section>
  );
}
