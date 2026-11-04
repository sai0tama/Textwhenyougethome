import { Link } from "@tanstack/react-router";

import { Reveal } from "@/components/ui/Reveal";
import { StoryForm } from "@/features/submissions/components/StoryForm";

export function ClosingNote() {
  return (
    <section className="paper-texture grain px-4 pb-20 sm:px-8 sm:pb-28">
      <div className="mx-auto w-full max-w-[1100px]">
        <Reveal>
          <p className="font-hand text-3xl text-pink">how does it work?</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mt-4 max-w-2xl font-display leading-tight tracking-tight text-ink [font-size:clamp(1.5rem,6.5vw,2.25rem)]">
            If you&apos;ve sent that text, you already know something worth keeping.
          </h2>
        </Reveal>

        <Reveal delay={0.15}>
          <StoryForm className="mt-10" />
        </Reveal>

        <Reveal delay={0.2}>
          <Link
            to="/archive"
            className="mt-8 inline-flex font-hand text-2xl text-ink underline decoration-ink/40 underline-offset-4 transition-transform hover:-translate-y-[2px]"
          >
            Read the archive →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
