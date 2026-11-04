import { Reveal } from "@/components/ui/Reveal";
import { StoryForm } from "@/features/submissions/components/StoryForm";

export function StorySubmissionSection() {
  return (
    <section
      id="submit-story"
      aria-label="Submit your story"
      className="paper-texture grain px-4 py-16 sm:px-8 sm:py-24 md:py-28 text-ink"
    >
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="text-center">
          <Reveal>
            <p className="font-hand text-3xl sm:text-4xl text-note-orange">how does it work?</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="mx-auto mt-3 max-w-3xl font-display leading-tight tracking-tight text-ink [font-size:clamp(1.75rem,5vw,2.5rem)]">
              If you&apos;ve sent that text, you already know something worth keeping.
            </h2>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <StoryForm className="mx-auto mt-10 max-w-full sm:mt-12 text-left shadow-lg" />
        </Reveal>
      </div>
    </section>
  );
}
