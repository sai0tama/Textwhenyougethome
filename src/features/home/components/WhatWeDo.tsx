import { LinkButton } from "@/components/ui/StreetButton";
import { Reveal } from "@/components/ui/Reveal";

export function WhatWeDo() {
  return (
    <section className="paper-texture px-4 py-14 sm:px-8 sm:py-20 md:py-24">
      <div className="mx-auto w-full max-w-[1400px]">
        <Reveal>
          <h2 className="mb-8 font-display text-2xl tracking-[-0.01em] text-ink sm:text-3xl">
            What we do?
          </h2>
        </Reveal>
        <Reveal>
          <div className="grain relative grid gap-8 rounded-[28px] bg-ink px-5 py-10 text-paper sm:gap-10 sm:rounded-[36px] sm:px-14 sm:py-14 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div className="font-display leading-[0.82] tracking-[-0.03em] text-highlight italic [font-size:clamp(2.8rem,13vw,6rem)]">
              <span className="block -skew-x-6">STREET</span>
              <span className="block -skew-x-6">SMART</span>
            </div>

            <div>
              <p className="text-base leading-relaxed text-paper/80 sm:text-xl">
                Most of us already read our streets without realising it. We slow down and do it
                together. Two hours, one neighbourhood, a small group paying attention to what the
                city asks of the people moving through it.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton to="/street-smart" variant="yellow">
                  Take a Peek
                </LinkButton>
                <LinkButton to="/archive" variant="ghostDark">
                  Read the archive
                </LinkButton>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
