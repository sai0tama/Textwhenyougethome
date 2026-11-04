import { motion } from "motion/react";
import { useState } from "react";

import { Reveal } from "@/components/ui/Reveal";
import { submitHostInquiryServerFn } from "@/server/functions/submitHostInquiry";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function HostSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    const trimmed = email.trim();
    if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await submitHostInquiryServerFn({ data: { email: trimmed } });
      if (res.success) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
        setErrorMessage(res.error || "Unable to send inquiry. Please try again.");
      }
    } catch (err: unknown) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMessage(msg);
    }
  }

  return (
    <section className="bg-highlight px-4 py-16 text-ink sm:px-8 sm:py-24 md:py-28">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          {/* Left Column: Eyebrow + Heading */}
          <div>
            <Reveal>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-ink/75 sm:text-sm">
                HOST ONE
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-4 font-display text-3xl font-black leading-[1.05] tracking-tight text-ink sm:mt-5 sm:text-5xl md:text-6xl">
                Bring Street Smart to your college, office or neighbourhood
              </h2>
            </Reveal>
          </div>

          {/* Right Column: Form */}
          <div className="w-full lg:max-w-md lg:justify-self-end">
            <Reveal delay={0.16}>
              {status === "success" ? (
                <div className="rounded-2xl border-2 border-ink bg-ink/5 p-6 text-ink">
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-full bg-ink text-xs font-bold text-highlight">
                      ✓
                    </span>
                    <h3 className="font-display text-lg font-bold">We got your note!</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink/80">
                    Thanks for reaching out. We&apos;ll be in touch soon to discuss bringing a walk
                    to your space.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStatus("idle")}
                    className="mt-4 text-xs font-bold underline underline-offset-4 hover:opacity-75"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (status === "error") setStatus("idle");
                      }}
                      placeholder="Your email"
                      disabled={status === "loading"}
                      aria-label="Your email address"
                      required
                      className="min-h-[48px] w-full flex-1 rounded-full border-2 border-ink bg-transparent px-5 py-3 text-sm font-medium text-ink placeholder:text-ink/60 focus:bg-ink/[0.03] focus:outline-none focus:ring-2 focus:ring-ink disabled:opacity-50 sm:text-base sm:px-6"
                    />
                    <motion.button
                      type="submit"
                      disabled={status === "loading"}
                      whileHover={{ y: -2, scale: 1.02 }}
                      whileTap={{ y: 0, scale: 0.98 }}
                      className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-full bg-ink px-7 py-3 text-sm font-bold text-paper shadow-md transition-all hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-60 sm:text-base sm:px-8"
                    >
                      {status === "loading" ? (
                        <span className="flex items-center gap-2">
                          <span className="size-4 animate-spin rounded-full border-2 border-paper border-t-transparent" />
                          Sending…
                        </span>
                      ) : (
                        "Get in touch"
                      )}
                    </motion.button>
                  </div>

                  {status === "error" && errorMessage && (
                    <p
                      role="alert"
                      className="rounded-lg bg-ink/10 px-4 py-2 font-mono text-xs font-semibold text-ink"
                    >
                      {errorMessage}
                    </p>
                  )}
                </form>
              )}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
