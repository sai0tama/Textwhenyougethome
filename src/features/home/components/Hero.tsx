import { motion } from "motion/react";

import { heroBg, heroGlobeMobile } from "@/assets/local";

import { LinkButton } from "@/components/ui/StreetButton";
import { Reveal } from "@/components/ui/Reveal";
import { HASHTAG } from "@/shared/stories";

export function Hero() {
  return (
    <section
      className="paper-texture relative overflow-hidden px-4 pb-14 pt-10 sm:px-8 sm:pb-24 sm:pt-16 md:bg-cover md:bg-center md:bg-no-repeat"
      style={{ ["--hero" as string]: `url(${heroBg.url})` }}
    >
      {/* desktop keeps the artwork as a full-bleed background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden bg-cover bg-center bg-no-repeat md:block"
        style={{ backgroundImage: `url(${heroBg.url})` }}
      />

      <div className="relative mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-10 sm:gap-14 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-6 md:pl-6">
          <Reveal>
            <p className="font-display leading-none tracking-tight text-ink [font-size:clamp(1.25rem,6vw,2.1rem)]">
              <span className="marker-highlight">{HASHTAG}</span>
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="mt-6 max-w-none font-display leading-[1.14] tracking-[-0.01em] text-ink [font-size:clamp(1.75rem,3.3vw,2.75rem)] sm:mt-7">
              a community built on the idea
              <br className="hidden sm:inline" /> that a safety text should never
              <br className="hidden sm:inline" /> have to be sent.
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-9 flex flex-wrap gap-3 sm:mt-12 sm:gap-5">
              <LinkButton to="/archive" className="min-h-[48px] px-6 py-3.5 text-highlight sm:px-9">
                Read the stories
              </LinkButton>
              <LinkButton
                to="/street-smart"
                className="min-h-[48px] px-6 py-3.5 text-highlight sm:px-9"
              >
                Explore walks
              </LinkButton>
            </div>
          </Reveal>
        </div>

        {/* tablet & mobile: dedicated mobile artwork, stacked below and centred */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
          className="relative flex justify-center md:col-span-6 md:min-h-[520px]"
        >
          <img
            src={heroGlobeMobile.url}
            alt="Hand-drawn halftone globe orbited by the words textwhenyougethome, okay? and reached?"
            width={1376}
            height={1148}
            fetchPriority="high"
            decoding="async"
            className="block h-auto w-[clamp(280px,92vw,520px)] object-contain mix-blend-multiply [filter:brightness(1.06)_contrast(1.04)_saturate(1.05)] [mask-image:radial-gradient(closest-side,black_72%,transparent_100%)] md:hidden"
          />
        </motion.div>
      </div>
    </section>
  );
}
