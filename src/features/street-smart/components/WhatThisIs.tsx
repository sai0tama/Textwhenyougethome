import { Reveal } from "@/components/ui/Reveal";
import { walkCrowd } from "@/assets/local";

export function WhatThisIs() {
  return (
    <section className="bg-ink px-4 py-14 text-paper sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-[1400px]">
        <Reveal>
          <h2 className="font-display leading-[0.95] tracking-tight text-highlight [font-size:clamp(2rem,8vw,3.75rem)]">
            What this is
          </h2>
        </Reveal>

        <div className="mt-8 grid gap-8 sm:mt-10 md:gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div className="space-y-6 text-base leading-relaxed text-paper/80 sm:text-lg">
            <Reveal delay={0.1}>
              <p>
                A Street Smart Walk is closer to fieldwork than an event. Nobody lectures. There is
                no fixed route to follow. We move at the pace of noticing, and we say what we see
                out loud.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <p>
                What people share on a walk is a kind of expertise. The person who knows which lane
                to avoid at nine but not at six. The vendor who watches the street empty every
                night. We treat that knowledge as research, because it is.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <img
              src={walkCrowd.url}
              alt="Line drawing of a group of people walking and talking together"
              width={648}
              height={355}
              loading="lazy"
              decoding="async"
              className="mx-auto block h-auto w-full max-w-[560px] mix-blend-screen md:max-w-none"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
