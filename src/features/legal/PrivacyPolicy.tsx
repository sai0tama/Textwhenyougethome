import { useNavigate, useRouter } from "@tanstack/react-router";
import { motion } from "motion/react";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Reveal } from "@/components/ui/Reveal";

export function PrivacyPolicy() {
  const navigate = useNavigate();
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
    } else {
      navigate({ to: "/" });
    }
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-ink text-paper">
      <Header />
      <main id="main-content" className="px-4 py-12 sm:px-8 sm:py-20">
        <div className="relative mx-auto w-full max-w-[900px]">
          <div className="mb-6 xl:absolute xl:-left-28 xl:top-1 xl:mb-0 2xl:-left-36">
            <motion.button
              type="button"
              onClick={handleBack}
              whileHover={{ x: -3 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-paper/30 px-4 py-2 text-xs font-semibold tracking-tight text-paper/90 transition-colors hover:border-highlight hover:text-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight sm:text-sm"
              aria-label="Go back to previous page"
            >
              <span aria-hidden="true">&larr;</span> Back
            </motion.button>
          </div>

          <Reveal>
            <h1 className="font-display text-3xl leading-tight text-highlight sm:text-5xl">
              Privacy Policy
            </h1>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-paper/70">
              Last Updated: September 2026
            </p>
          </Reveal>

          <div className="mt-10 space-y-10 text-sm leading-relaxed text-paper/85 sm:text-base">
            <Reveal delay={0.05}>
              <section className="space-y-3">
                <h2 className="font-display text-xl text-highlight sm:text-2xl">1. Overview</h2>
                <p>
                  Welcome to <strong>Street Smart / Street Speak Archive</strong>. We are a
                  community-driven archive dedicated to collecting stories, experiences, photos, and
                  voice notes shared by individuals.
                </p>
                <p className="rounded-lg border border-paper/20 bg-paper-deep/10 p-4 font-mono text-xs text-paper/90">
                  <strong>Community Project:</strong> Street Smart / Street Speak Archive
                  (#textwhenyougethome)
                  <br />
                  <span className="text-paper/70">
                    <strong>Legal Entity Details:</strong> [TODO: Official Registered Entity Name,
                    Registration Number, and Registered Address to be provided by site owner]
                  </span>
                </p>
              </section>
            </Reveal>

            <Reveal delay={0.1}>
              <section className="space-y-3">
                <h2 className="font-display text-xl text-highlight sm:text-2xl">
                  2. Information We Collect
                </h2>
                <p>
                  When you contribute to the archive, we collect the information you voluntarily
                  provide:
                </p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>
                    <strong>Written Stories:</strong> Name or alias, age, city/country, and story
                    content.
                  </li>
                  <li>
                    <strong>Audio Recordings:</strong> Voice notes recorded or uploaded through the
                    audio feature.
                  </li>
                  <li>
                    <strong>Photos:</strong> Photographs submitted to accompany stories or memories.
                  </li>
                </ul>
                <p className="pt-2">
                  We do not collect account passwords, financial payment details, or tracking
                  profiles.
                </p>
              </section>
            </Reveal>

            <Reveal delay={0.15}>
              <section className="space-y-3">
                <h2 className="font-display text-xl text-highlight sm:text-2xl">
                  3. How We Use & Share Your Data
                </h2>
                <p>
                  Submissions are reviewed by site moderators. Once approved, written stories, voice
                  notes, and photos may be published publicly on our digital archive and associated
                  public community displays.
                </p>
                <p>
                  Your submissions are stored securely using backend services provided by Wix
                  Headless CMS and Wix Media Manager. Media files are delivered via content delivery
                  networks (including Cloudfront CDN).
                </p>
              </section>
            </Reveal>

            <Reveal delay={0.2}>
              <section className="space-y-3">
                <h2 className="font-display text-xl text-highlight sm:text-2xl">
                  4. Cookies & Analytics
                </h2>
                <p>
                  Our application uses essential in-memory tokens provided by the Wix SDK for API
                  authorization. We do not currently drop non-essential tracking cookies or run
                  third-party advertising pixels.
                </p>
                <p>
                  If analytical tools or cookies are introduced in the future, this policy and our
                  consent management will be updated accordingly.
                </p>
              </section>
            </Reveal>

            <Reveal delay={0.25}>
              <section className="space-y-3">
                <h2 className="font-display text-xl text-highlight sm:text-2xl">
                  5. Your Data Rights & Contact
                </h2>
                <p>
                  You have the right to request access to your submitted content, ask for updates,
                  or request the removal/deletion of a story, audio recording, or photo you
                  previously submitted.
                </p>
                <p>To make a privacy request or contact our team:</p>
                <p className="rounded-lg border border-paper/20 bg-paper-deep/10 p-4 font-mono text-xs text-paper/90">
                  <strong>Contact Email:</strong> [TODO: Official Privacy &amp; Data Contact Email
                  Address to be provided by site owner]
                </p>
              </section>
            </Reveal>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
