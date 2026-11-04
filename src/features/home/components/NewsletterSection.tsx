import { useState, type FormEvent } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { subscribeToNewsletter } from "@/features/home/client/newsletterSubmitter";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "duplicate" | "error">(
    "idle",
  );
  const [feedbackMessage, setFeedbackMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    const trimmed = email.trim();
    if (!trimmed) {
      setStatus("error");
      setFeedbackMessage("Please enter your email address.");
      return;
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      setStatus("error");
      setFeedbackMessage("Please enter a valid email address.");
      return;
    }

    if (!consent) {
      setStatus("error");
      setFeedbackMessage(
        "Please confirm that you agree to receive occasional newsletters and updates.",
      );
      return;
    }

    setStatus("loading");
    setFeedbackMessage("");

    const res = await subscribeToNewsletter(trimmed, consent);

    if (res.success && res.status === "subscribed") {
      setStatus("success");
      setFeedbackMessage("You're subscribed! Thanks for joining.");
      setEmail("");
      setConsent(false);
    } else if (res.status === "duplicate") {
      setStatus("duplicate");
      setFeedbackMessage(res.error || "You're already subscribed to our newsletter.");
    } else {
      setStatus("error");
      setFeedbackMessage(res.error || "Something went wrong. Please try again.");
    }
  }

  return (
    <section
      aria-label="Newsletter subscription"
      className="bg-highlight px-4 py-16 text-ink sm:px-8 sm:py-20 md:py-24"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Eyebrow + Headline */}
          <div className="lg:col-span-7">
            <Reveal>
              <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-ink/75">
                ONCE A MONTH
              </span>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-2.5 max-w-xl font-display text-3xl font-bold leading-[1.12] tracking-tight text-ink sm:text-4xl lg:text-5xl">
                New stories, upcoming walks, what we&apos;re learning
              </h2>
            </Reveal>
          </div>

          {/* Right Column: Email Input + Subscribe Button */}
          <div className="lg:col-span-5">
            <Reveal delay={0.12}>
              <form onSubmit={handleSubmit} className="w-full" noValidate>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <label htmlFor="newsletter-email" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="newsletter-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (status === "error" || status === "duplicate") {
                          setStatus("idle");
                          setFeedbackMessage("");
                        }
                      }}
                      placeholder="Your email"
                      disabled={status === "loading"}
                      aria-invalid={status === "error"}
                      aria-describedby={feedbackMessage ? "newsletter-feedback" : undefined}
                      className="w-full rounded-full border-2 border-ink bg-transparent px-5 py-3.5 text-sm font-semibold text-ink placeholder:text-ink/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-full bg-ink px-8 py-3.5 text-sm font-semibold text-highlight transition-all hover:bg-ink-soft hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === "loading" ? "Subscribing..." : "Subscribe"}
                  </button>
                </div>

                {/* Explicit Marketing Consent Checkbox */}
                <div className="mt-4 flex items-start gap-2.5">
                  <input
                    id="newsletter-consent"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      if (status === "error" && feedbackMessage.includes("agree")) {
                        setStatus("idle");
                        setFeedbackMessage("");
                      }
                    }}
                    disabled={status === "loading"}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-ink text-ink accent-ink focus:ring-2 focus:ring-ink"
                  />
                  <label
                    htmlFor="newsletter-consent"
                    className="text-xs leading-relaxed text-ink/80"
                  >
                    I agree to receive occasional newsletters and updates from Text When You Get
                    Home. I can unsubscribe at any time. View our{" "}
                    <a
                      href="/privacy"
                      className="font-semibold underline underline-offset-2 hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
                    >
                      Privacy Policy
                    </a>
                    .
                  </label>
                </div>

                {/* Accessible Feedback message */}
                {feedbackMessage ? (
                  <div
                    id="newsletter-feedback"
                    role="status"
                    aria-live="polite"
                    className={`mt-3 text-xs font-semibold sm:text-sm ${
                      status === "success"
                        ? "text-ink"
                        : status === "duplicate"
                          ? "text-ink/80"
                          : "text-[#b91c1c]"
                    }`}
                  >
                    {feedbackMessage}
                  </div>
                ) : null}
              </form>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
