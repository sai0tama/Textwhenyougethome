import { Reveal } from "@/components/ui/Reveal";

export function ArchiveHeader() {
  return (
    <section className="bg-ink px-4 pb-8 pt-12 text-paper sm:px-8 sm:pb-14 sm:pt-24">
      <div className="mx-auto w-full max-w-[1400px] md:pl-[10%]">
        <Reveal>
          <h1 className="font-display leading-[0.95] tracking-tight text-highlight [font-size:clamp(2rem,10vw,3rem)]">
            Post your story
          </h1>
        </Reveal>
        <div className="mt-8 w-full max-w-4xl space-y-6 text-[0.95rem] leading-loose text-paper/85 sm:mt-14 sm:space-y-8 sm:text-lg lg:max-w-5xl">
          <Reveal delay={0.1}>
            <p>
              This is a collection of a habit almost everyone shares. The text you send when you
              reach your door. The person who waits up for it. We gather these small moments from
              cities around the world and keep them in one place.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <p>
              Apart, each one is private. Together they show something. Who watches over whom, which
              streets ask for a text, and how people make each other safe when a city won&apos;t.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
