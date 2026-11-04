import { AudioRecorder } from "@/features/submissions/components/AudioRecorder";
import { PhotoSubmission } from "@/features/submissions/components/PhotoSubmission";
import { Reveal } from "@/components/ui/Reveal";
import { StoryForm } from "@/features/submissions/components/StoryForm";

export function StorySubmission() {
  return (
    <section className="bg-ink px-4 pb-20 sm:px-8 sm:pb-28">
      <div className="mx-auto w-full max-w-[1100px]">
        <Reveal>
          <h2 className="text-center font-display leading-tight tracking-tight text-highlight [font-size:clamp(1.5rem,6.5vw,2.25rem)]">
            Add your voice to the archive.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-loose text-paper/80 sm:text-base">
            Every story adds a new perspective. Share your experience and become part of a growing
            collection of voices, memories, and moments that help us understand ourselves and each
            other a little better.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <StoryForm className="mx-auto mt-12 w-full" />
        </Reveal>

        {/* 50/50 Compact Combined Audio Recording & Photo Submission Section */}
        <Reveal delay={0.2}>
          <div className="mx-auto mt-10 w-full rounded-xl border border-paper/15 bg-ink/50 p-5 sm:p-6 md:p-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 md:divide-x md:divide-paper/15 md:[&>*:last-child]:pl-8">
              <AudioRecorder />
              <PhotoSubmission />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
