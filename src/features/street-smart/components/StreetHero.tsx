import { Reveal } from "@/components/ui/Reveal";
import { moodyNightStreet } from "@/assets/local";

export function StreetHero() {
  return (
    <section className="relative bg-ink text-paper">
      <div className="grid md:grid-cols-2">
        <div className="flex flex-col justify-center px-5 py-12 sm:min-h-[420px] sm:px-12 sm:py-24 md:min-h-[620px] md:pl-[10%]">
          <Reveal>
            <h2 className="overflow-visible pl-1 pr-2 font-display italic leading-[0.9] tracking-[-0.03em] text-highlight [font-size:clamp(2.25rem,7.5vw,4.75rem)]">
              <span className="block">WALKS &amp;</span>
              <span className="block">WORKSHOPS</span>
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-7 max-w-md text-base leading-loose text-paper/80 sm:mt-10 sm:text-lg">
              We walk together to notice what the city quietly asks us to ignore.
            </p>
          </Reveal>
        </div>

        <figure className="relative aspect-[4/3] w-full sm:aspect-auto sm:min-h-[320px] md:min-h-[620px]">
          <img
            src={moodyNightStreet.url}
            alt="Empty city street at night with parked cars, leafy trees, and warm streetlights"
            width={1024}
            height={416}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[62%_center] brightness-[0.82]"
          />
          <div className="pointer-events-none absolute inset-0 bg-ink/15" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ink to-transparent" />
        </figure>
      </div>
    </section>
  );
}
