import { Link } from "@tanstack/react-router";
import { useState } from "react";

import type { NoteColor } from "@/features/submissions/client/localNoteStorage";
import { filters, type FilterId } from "@/shared/filters";
import { submitStory } from "@/features/submissions/client/storySubmitter";
import { cn } from "@/lib/utils";

type Errors = Partial<Record<"name" | "age" | "city" | "story" | "consent", string>>;

const LINE =
  "w-full border-0 bg-transparent text-sm font-semibold text-ink placeholder:text-ink/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 rounded-md px-1 py-0.5";

const NOTE_COLORS: NoteColor[] = ["yellow", "pink", "orange", "blue", "green", "purple"];

/**
 * The grey card with the big yellow story field — the exact submission block
 * used on the home page and in the archive.
 */
export function StoryForm({ className }: { className?: string }) {
  const [form, setForm] = useState({ name: "", age: "", city: "", story: "" });
  const [consent, setConsent] = useState(false);
  const [topic, setTopic] = useState<FilterId | null>(null);
  const [tagOpen, setTagOpen] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    console.log("[DIAGNOSTIC] POST CLICKED");
    if (submitting) return;
    const next: Errors = {};
    if (form.name.trim().length < 2) next.name = "Tell us what to call you.";
    if (!/^\d{1,3}$/.test(form.age.trim())) next.age = "Age in numbers.";
    if (form.city.trim().length < 2) next.city = "Which city or country?";
    if (form.story.trim().length < 20) next.story = "A little more — at least 20 characters.";
    if (!consent)
      next.consent = "Please check the box to agree to the publication & privacy terms.";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      console.log("[DIAGNOSTIC] FORM VALIDATION FAILED", next);
      return;
    }

    setSubmitting(true);
    const randomColor = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)] ?? "yellow";
    console.log("[DIAGNOSTIC] SUBMIT STORY CALLED");
    const res = await submitStory({
      name: form.name.trim(),
      age: parseInt(form.age.trim(), 10),
      city: form.city.trim(),
      story: form.story.trim(),
      color: randomColor,
      filterId: topic || "safety-care",
    });
    setSubmitting(false);

    if (res.success) {
      console.log("[DIAGNOSTIC] STORY SUBMITTED SUCCESS", res.id);
      setSubmitted(true);
    } else {
      console.log("[DIAGNOSTIC] STORY SUBMITTED FAILED", res.error);
      setErrors({ story: res.error || "Unable to submit your story right now." });
    }
  }

  const activeError = Object.values(errors).filter(Boolean)[0];

  return (
    <div
      className={cn(
        "grain relative w-full max-w-full rounded-[20px] bg-paper-deep p-3 sm:rounded-[26px] sm:p-6",
        className,
      )}
    >
      {submitted ? (
        <div
          className="rounded-[18px] bg-note-yellow px-6 py-16 text-center text-ink"
          aria-live="polite"
        >
          <p className="font-display text-2xl">Received &amp; Submitted for Review.</p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink/85">
            Your story has been submitted for review and will appear publicly once approved by the
            site owner.
          </p>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setConsent(false);
              setForm({ name: "", age: "", city: "", story: "" });
            }}
            className="mt-8 rounded-full bg-ink px-6 py-2.5 text-xs font-semibold text-highlight transition-transform hover:-translate-y-[2px] focus-visible:ring-2 focus-visible:ring-highlight"
          >
            Write another
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2 px-2 pb-3 pt-1 sm:grid-cols-3 sm:gap-6">
            <div>
              <label htmlFor="story-name" className="sr-only">
                Name or Alias
              </label>
              <input
                id="story-name"
                aria-label="Name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "story-form-error" : undefined}
                className={LINE}
                placeholder="write name here"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="story-age" className="sr-only">
                Age
              </label>
              <input
                id="story-age"
                aria-label="Age"
                inputMode="numeric"
                aria-invalid={Boolean(errors.age)}
                aria-describedby={errors.age ? "story-form-error" : undefined}
                className={cn(LINE, "sm:text-center")}
                placeholder="write age here"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="story-city" className="sr-only">
                City and Country
              </label>
              <input
                id="story-city"
                aria-label="City and country"
                aria-invalid={Boolean(errors.city)}
                aria-describedby={errors.city ? "story-form-error" : undefined}
                className={cn(LINE, "sm:text-right")}
                placeholder="write city,country here"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
          </div>

          <div className="relative grid w-full items-center justify-center rounded-[16px] bg-note-yellow">
            <textarea
              id="story-text"
              aria-label="Your story"
              aria-invalid={Boolean(errors.story)}
              aria-describedby={errors.story ? "story-form-error" : undefined}
              className="col-start-1 row-start-1 min-h-[200px] w-full resize-none rounded-[16px] bg-transparent px-4 py-8 text-center text-sm font-semibold leading-relaxed text-ink overflow-y-auto break-words focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 sm:min-h-[240px] sm:px-6 sm:py-12"
              value={form.story}
              onChange={(e) => setForm({ ...form, story: e.target.value })}
            />
            {!form.story && (
              <span
                className="pointer-events-none col-start-1 row-start-1 select-none px-4 text-center text-sm font-semibold leading-relaxed text-ink/65 sm:px-6"
                aria-hidden="true"
              >
                Tell us your story.
              </span>
            )}
          </div>

          {tagOpen ? (
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setTopic(f.id);
                    setTagOpen(false);
                  }}
                  className={cn(
                    "rounded-full border border-ink/40 px-3 py-1 text-[11px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ink",
                    topic === f.id ? "bg-ink text-highlight" : "bg-paper text-ink",
                  )}
                >
                  {f.archiveLabel}
                </button>
              ))}
            </div>
          ) : null}

          {/* Consent Checkbox */}
          <div className="mt-4 flex items-start gap-2.5 px-2">
            <input
              type="checkbox"
              id="story-consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={errors.consent ? "story-form-error" : undefined}
              className="mt-0.5 size-4 shrink-0 rounded border-ink/40 text-ink focus:ring-2 focus:ring-ink/40"
            />
            <label htmlFor="story-consent" className="text-[11px] leading-tight text-ink/80">
              I agree that my story may be reviewed, moderated, and publicly displayed in the
              archive. I have read the{" "}
              <Link
                to="/privacy"
                target="_blank"
                className="underline hover:text-ink font-semibold"
              >
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link to="/terms" target="_blank" className="underline hover:text-ink font-semibold">
                Terms &amp; Conditions
              </Link>
              .
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-2">
            <div
              id="story-form-error"
              aria-live="polite"
              className="text-[11px] font-medium text-note-orange"
            >
              {activeError ?? `${form.story.trim().length} characters`}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTagOpen((v) => !v)}
                className="inline-flex min-h-[44px] items-center rounded-full bg-ink px-5 py-2 text-xs font-semibold text-highlight transition-transform hover:-translate-y-[2px] focus-visible:ring-2 focus-visible:ring-highlight"
              >
                {topic ? filters.find((f) => f.id === topic)?.archiveLabel : "Select tag"}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className={cn(
                  "inline-flex min-h-[44px] items-center rounded-full border border-ink px-6 py-2 text-xs font-semibold text-ink transition-transform hover:-translate-y-[2px] hover:bg-ink hover:text-highlight focus-visible:ring-2 focus-visible:ring-ink",
                  submitting && "opacity-50 cursor-not-allowed hover:translate-y-0",
                )}
              >
                {submitting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
