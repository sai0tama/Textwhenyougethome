import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Reveal } from "@/components/ui/Reveal";
import { NewsletterSection } from "@/features/home/components/NewsletterSection";

const EMERGENCY_RESOURCES = [
  { label: "Emergency (India)", number: "112" },
  { label: "Women's helpline (India)", number: "181" },
  { label: "Police (India)", number: "100" },
  { label: "Emergency (UK)", number: "999" },
];

export function AboutPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-ink text-paper">
      <Header />

      <main id="main-content">
        {/* Main About Editorial Section */}
        <section
          aria-label="About Text When You Get Home"
          className="px-4 py-14 sm:px-6 sm:py-20 md:py-24 lg:px-8 lg:py-28"
        >
          <div className="mx-auto w-full max-w-[1280px]">
            <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-14 xl:gap-20">
              {/* Left Column: Heading and Narrative Copy */}
              <div className="lg:col-span-7 xl:col-span-7">
                <Reveal>
                  <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-paper/60">
                    ABOUT
                  </span>
                </Reveal>

                <Reveal delay={0.06}>
                  <h1 className="mt-4 font-display text-3xl font-bold leading-[1.12] tracking-tight text-paper sm:text-4xl md:text-5xl lg:text-[3.25rem]">
                    A community built on the idea that a safety text should never have to be sent
                  </h1>
                </Reveal>

                <div className="mt-8 space-y-6 text-base leading-relaxed text-paper/80 sm:text-lg sm:leading-relaxed">
                  <Reveal delay={0.12}>
                    <p>
                      Text When You Get Home started with a habit almost everyone shares. We asked
                      why we do it. The answer is rarely personal anxiety; it is design. Streets,
                      transit and public spaces were not built with everyone&apos;s safety in mind.
                    </p>
                  </Reveal>

                  <Reveal delay={0.18}>
                    <p>
                      We collect the stories behind the text, walk the streets they describe, and
                      make things together, so the pattern stops feeling private and becomes
                      something cities are designed around.
                    </p>
                  </Reveal>

                  <Reveal delay={0.24}>
                    <p>
                      TWYGH is a community and experimental lab by Mudito, a research and design
                      practice working on safety, inclusion and belonging in public spaces.
                    </p>
                  </Reveal>
                </div>

                {/* Team Placeholder Label */}
                <Reveal delay={0.3}>
                  <div className="mt-12 rounded-xl border border-dashed border-paper/20 bg-ink-soft/40 px-6 py-6 sm:px-8 sm:py-7">
                    <p className="font-mono text-xs uppercase tracking-[0.22em] text-paper/45">
                      TEAM · PHOTOS AND NAMES TO ADD
                    </p>
                  </div>
                </Reveal>
              </div>

              {/* Right Column: Emergency Resources and Privacy Cards */}
              <div className="space-y-6 lg:col-span-5 xl:col-span-5 lg:pt-2">
                {/* Emergency Resources Card */}
                <Reveal delay={0.1}>
                  <div className="rounded-[22px] border border-paper/15 bg-ink p-6 sm:p-8">
                    <h2 className="font-display text-xl font-bold tracking-tight text-paper sm:text-2xl">
                      If you need help now
                    </h2>

                    <ul className="mt-6 divide-y divide-paper/10">
                      {EMERGENCY_RESOURCES.map((resource) => (
                        <li
                          key={resource.label}
                          className="flex items-center justify-between py-3.5 text-sm sm:text-base first:pt-0"
                        >
                          <span className="text-paper/85">{resource.label}</span>
                          <span className="font-mono text-base font-bold text-highlight sm:text-lg">
                            {resource.number}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <p className="mt-6 text-xs leading-relaxed text-paper/50">
                      Placeholder list. Confirm numbers and add mental health and reporting
                      resources before launch.
                    </p>
                  </div>
                </Reveal>

                {/* Privacy Card */}
                <Reveal delay={0.16}>
                  <div className="rounded-[22px] border border-paper/15 bg-ink p-6 sm:p-8">
                    <h2 className="font-display text-xl font-bold tracking-tight text-paper sm:text-2xl">
                      Privacy, in plain words
                    </h2>

                    <p className="mt-4 text-sm leading-relaxed text-paper/70 sm:text-base sm:leading-relaxed">
                      We show first name or &ldquo;Anonymous&rdquo;, age and city only. Every story
                      is read before it&apos;s published. Email us any time to remove yours.
                    </p>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* Reused Newsletter Section */}
        <NewsletterSection />
      </main>

      {/* Reused Footer */}
      <Footer />
    </div>
  );
}
