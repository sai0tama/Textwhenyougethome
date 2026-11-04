import { Reveal } from "@/components/ui/Reveal";
import { cityNetwork } from "@/assets/local";

export function WhyThisExists() {
  return (
    <section className="bg-ink px-4 py-14 text-paper sm:px-8 sm:py-20 md:py-28">
      <div className="mx-auto grid w-full max-w-[1400px] gap-8 md:gap-10 md:grid-cols-2 md:items-center md:gap-12">
        <Reveal>
          {/* the reference network drawing, blended straight into the black */}
          <figure className="relative">
            <img
              src={cityNetwork.url}
              alt="A hand-traced network of city streets with glowing junctions"
              width={886}
              height={614}
              loading="lazy"
              decoding="async"
              className="mx-auto block h-auto w-full max-w-[520px] mix-blend-screen md:max-w-none"
            />
          </figure>
        </Reveal>

        <div>
          <Reveal>
            <h2 className="font-display leading-[0.95] tracking-tight [font-size:clamp(2rem,8vw,3.75rem)]">
              Why this exists
            </h2>
          </Reveal>
          <div className="mt-8 space-y-6 text-base leading-relaxed text-paper/75 sm:text-lg">
            <Reveal delay={0.1}>
              <p>
                The text is rarely about the person we send it to. It&apos;s about the walk from the
                bus stop. The lone shift with no lights.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <p>
                The stretch everyone knows to cross quickly. We are recording those details, not the
                worry.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <p>
                One by one, so the pattern stops feeling private and starts being the thing we
                design cities around.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
