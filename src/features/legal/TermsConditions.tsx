import { useNavigate, useRouter } from "@tanstack/react-router";
import { motion } from "motion/react";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Reveal } from "@/components/ui/Reveal";

export function TermsConditions() {
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
              Terms &amp; Conditions
            </h1>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-paper/70">
              Last Updated: September 2026
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#terms"
                className="rounded-full border border-paper/30 px-3.5 py-1.5 font-mono text-xs text-paper/80 transition-colors hover:border-highlight hover:text-highlight focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-highlight"
              >
                &darr; Terms &amp; Conditions
              </a>
              <a
                href="#community-guidelines"
                className="rounded-full border border-paper/30 px-3.5 py-1.5 font-mono text-xs text-paper/80 transition-colors hover:border-highlight hover:text-highlight focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-highlight"
              >
                &darr; Community Guidelines
              </a>
            </div>
          </Reveal>

          <div className="mt-12 space-y-16 text-sm leading-relaxed text-paper/85 sm:text-base">
            {/* PART 1: TERMS & CONDITIONS */}
            <section id="terms" aria-labelledby="terms-heading" className="space-y-10 scroll-mt-24">
              <div className="border-b border-paper/15 pb-3">
                <h2
                  id="terms-heading"
                  className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-paper/50"
                >
                  SECTION 1 &mdash; TERMS &amp; CONDITIONS
                </h2>
              </div>

              <Reveal delay={0.05}>
                <section className="space-y-3">
                  <h3 className="font-display text-xl text-highlight sm:text-2xl">
                    1. Acceptance of Terms
                  </h3>
                  <p>
                    By visiting, viewing, or submitting content to{" "}
                    <strong>Street Smart / Street Speak Archive</strong>, you agree to these Terms
                    &amp; Conditions. If you do not agree, please do not use the website or submit
                    content.
                  </p>
                  <p className="rounded-lg border border-paper/20 bg-paper-deep/10 p-4 font-mono text-xs text-paper/90">
                    <strong>Project:</strong> Street Smart / Street Speak Archive
                    (#textwhenyougethome)
                    <br />
                    <span className="text-paper/70">
                      <strong>Operating Entity &amp; Jurisdiction:</strong> [TODO: Official
                      Operating Legal Entity Name &amp; Governing Jurisdiction to be provided by
                      site owner]
                    </span>
                  </p>
                </section>
              </Reveal>

              <Reveal delay={0.1}>
                <section className="space-y-3">
                  <h3 className="font-display text-xl text-highlight sm:text-2xl">
                    2. User Submissions &amp; Content Grant
                  </h3>
                  <p>When you submit a story, audio recording, or photo:</p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>
                      You confirm that you own or have the necessary rights to submit the content.
                    </li>
                    <li>
                      You grant Street Speak Archive a non-exclusive, worldwide, royalty-free
                      license to host, display, moderate, publish, and archive the content as part
                      of the community archive project.
                    </li>
                    <li>
                      You acknowledge that approved submissions may be made publicly accessible on
                      the website.
                    </li>
                  </ul>
                </section>
              </Reveal>

              <Reveal delay={0.15}>
                <section className="space-y-3">
                  <h3 className="font-display text-xl text-highlight sm:text-2xl">
                    3. Moderation &amp; Prohibited Content
                  </h3>
                  <p>
                    All submissions undergo moderation prior to public display. We reserve the right
                    to edit, decline, or remove any submission at our sole discretion.
                  </p>
                  <p>
                    Submissions must not contain hateful, defamatory, illegal, sexually explicit, or
                    infringing material, or private personal data of third parties without consent.
                  </p>
                </section>
              </Reveal>

              <Reveal delay={0.2}>
                <section className="space-y-3">
                  <h3 className="font-display text-xl text-highlight sm:text-2xl">
                    4. Intellectual Property
                  </h3>
                  <p>
                    The design, graphics, software, and compilation of the archive are protected by
                    copyright and intellectual property laws. Content submitted by community members
                    remains the property of its respective creators under the license granted above.
                  </p>
                </section>
              </Reveal>

              <Reveal delay={0.25}>
                <section className="space-y-3">
                  <h3 className="font-display text-xl text-highlight sm:text-2xl">
                    5. Contact &amp; Removal Requests
                  </h3>
                  <p>
                    If you wish to request the removal of content you submitted, or report a terms
                    violation:
                  </p>
                  <p className="rounded-lg border border-paper/20 bg-paper-deep/10 p-4 font-mono text-xs text-paper/90">
                    <strong>Contact Email:</strong> [TODO: Official Legal &amp; Removal Requests
                    Contact Email Address to be provided by site owner]
                  </p>
                </section>
              </Reveal>
            </section>

            {/* PART 2: COMMUNITY GUIDELINES */}
            <section
              id="community-guidelines"
              aria-labelledby="community-guidelines-heading"
              className="space-y-10 border-t border-paper/20 pt-12 scroll-mt-24"
            >
              <div className="border-b border-paper/15 pb-3">
                <h2
                  id="community-guidelines-heading"
                  className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-paper/50"
                >
                  SECTION 2 &mdash; COMMUNITY GUIDELINES
                </h2>
              </div>

              <Reveal delay={0.05}>
                <div className="space-y-3">
                  <h3 className="font-display text-2xl text-highlight sm:text-3xl">
                    Community Guidelines
                  </h3>
                  <p>
                    Text When You Get Home (#textwhenyougethome) is a community-driven initiative
                    and experimental lab by Mudito. We collect real stories, walking audits, voice
                    notes, and photographs to understand public space, street safety, and community
                    care.
                  </p>
                  <p>
                    To keep this archive safe, respectful, and supportive for everyone, all
                    participants and contributors are expected to uphold these community standards:
                  </p>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <section className="space-y-3">
                  <h3 className="font-display text-xl text-highlight sm:text-2xl">
                    1. Respect, Care &amp; Mutual Dignity
                  </h3>
                  <p>
                    Every story shared here reflects personal, often vulnerable experiences in
                    public spaces. We do not tolerate hateful speech, harassment, abuse, defamation,
                    discrimination, sexually explicit material, or violence.
                  </p>
                </section>
              </Reveal>

              <Reveal delay={0.15}>
                <section className="space-y-3">
                  <h3 className="font-display text-xl text-highlight sm:text-2xl">
                    2. Privacy &amp; Third-Party Protection
                  </h3>
                  <p>
                    Always protect the safety and privacy of others. When submitting stories or
                    media:
                  </p>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>
                      Do not submit private personal data, contact information, full names, or home
                      addresses of third parties without their explicit consent.
                    </li>
                    <li>
                      Do not submit photographs showing recognizable faces of bystanders in private
                      or vulnerable contexts without permission.
                    </li>
                    <li>
                      Contributors may use pseudonyms or submit anonymously to protect their own
                      privacy.
                    </li>
                  </ul>
                </section>
              </Reveal>

              <Reveal delay={0.2}>
                <section className="space-y-3">
                  <h3 className="font-display text-xl text-highlight sm:text-2xl">
                    3. Authenticity &amp; Ownership
                  </h3>
                  <p>
                    Only share stories, voice notes, and photographs that you have created or have
                    the clear right and permission to submit. Do not submit copyrighted materials,
                    commercial advertisements, or impersonated narratives.
                  </p>
                </section>
              </Reveal>

              <Reveal delay={0.25}>
                <section className="space-y-3">
                  <h3 className="font-display text-xl text-highlight sm:text-2xl">
                    4. Pre-Publication Moderation
                  </h3>
                  <p>
                    To ensure safety and adherence to these standards, all submissions undergo
                    manual moderation before they appear on the public archive or interactive map.
                    We reserve the right to decline, edit for formatting or length, or remove any
                    submission that violates these guidelines or compromises community safety.
                  </p>
                </section>
              </Reveal>

              <Reveal delay={0.3}>
                <section className="space-y-3">
                  <h3 className="font-display text-xl text-highlight sm:text-2xl">
                    5. Reporting &amp; Content Removal
                  </h3>
                  <p>
                    If you wish to withdraw a story, recording, or photo you previously submitted,
                    or if you notice any content in the archive that violates these guidelines,
                    please reach out to our team:
                  </p>
                  <p className="rounded-lg border border-paper/20 bg-paper-deep/10 p-4 font-mono text-xs text-paper/90">
                    <strong>Community Inquiries &amp; Safety Reports:</strong>{" "}
                    <a
                      href="mailto:hello@textwhenyougethome.org"
                      className="underline transition-colors hover:text-highlight"
                    >
                      hello@textwhenyougethome.org
                    </a>
                    <br />
                    <span className="text-paper/70">
                      <strong>Notice:</strong> Detailed standalone community guidelines and code of
                      conduct are being finalized by the editorial team.
                    </span>
                  </p>
                </section>
              </Reveal>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
