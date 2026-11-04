import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { submitPhotoSubmission } from "@/features/submissions/client/photoSubmitter";

/** Compact photo submission component. */
export function PhotoSubmission() {
  const input = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview.url);
    },
    [preview],
  );

  function selectFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That file isn't an image.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Please keep it under 8 MB.");
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setIsSubmitted(false);
    setSelectedFile(file);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return { url: URL.createObjectURL(file), name: file.name };
    });
  }

  function resetSelection() {
    setError(null);
    setSuccessMsg(null);
    setIsSubmitted(false);
    setSelectedFile(null);
    if (preview) {
      URL.revokeObjectURL(preview.url);
      setPreview(null);
    }
    if (input.current) {
      input.current.value = "";
    }
  }

  async function submit() {
    if (!selectedFile || isUploading) return;
    setError(null);
    setSuccessMsg(null);
    setIsUploading(true);
    const result = await submitPhotoSubmission(selectedFile);
    setIsUploading(false);

    if (result.status === "error") {
      setError(result.message);
    } else {
      setSuccessMsg("Photo submitted for review!");
      setIsSubmitted(true);
    }
  }

  return (
    <div
      className="flex flex-col space-y-2.5 border-t border-paper/15 pt-6 md:border-t-0 md:pt-0"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        selectFile(e.dataTransfer.files?.[0]);
      }}
    >
      <h3 className="font-display text-base leading-tight text-highlight sm:text-lg">
        Share a Photo, Tell a Story
      </h3>
      <p className="text-xs leading-relaxed text-paper/75">
        Share a photo and a few words about the people or places behind it.{" "}
        <Link to="/privacy" target="_blank" className="underline hover:text-highlight">
          Privacy Policy
        </Link>
      </p>

      <div className="pt-1">
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          aria-label="Upload photo"
          className="hidden"
          onChange={(e) => selectFile(e.target.files?.[0])}
        />

        {preview ? (
          <figure className="grain relative mb-3 w-[180px] sm:w-[210px] rotate-[-1.5deg] bg-paper-deep p-1.5 physical-shadow">
            <img
              src={preview.url}
              alt={`Preview of ${preview.name}`}
              decoding="async"
              className="block h-auto max-h-[140px] w-full object-cover"
            />
            <figcaption className="mt-1 truncate font-mono text-[8px] uppercase tracking-[0.15em] text-ink/60">
              {preview.name}
            </figcaption>
          </figure>
        ) : null}

        {!preview && !isSubmitted ? (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="inline-flex min-h-[38px] items-center justify-center rounded-full bg-note-yellow px-5 py-2 text-xs font-semibold text-ink transition-transform hover:-translate-y-[2px] focus-visible:ring-2 focus-visible:ring-highlight"
          >
            Choose photo
          </button>
        ) : null}

        {preview && !isSubmitted ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => {
                resetSelection();
                input.current?.click();
              }}
              className="inline-flex min-h-[36px] items-center justify-center rounded-full border border-paper/40 px-4 py-1.5 text-xs font-semibold text-paper transition-colors hover:border-highlight hover:text-highlight disabled:opacity-50"
            >
              Choose another
            </button>
            <button
              type="button"
              disabled={isUploading}
              onClick={submit}
              className="inline-flex min-h-[36px] items-center justify-center rounded-full bg-note-yellow px-5 py-1.5 text-xs font-semibold text-ink transition-transform hover:-translate-y-[2px] disabled:opacity-50"
            >
              {isUploading ? "Submitting..." : "Submit"}
            </button>
          </div>
        ) : null}

        {isSubmitted ? (
          <button
            type="button"
            onClick={() => {
              resetSelection();
              input.current?.click();
            }}
            className="inline-flex min-h-[38px] items-center justify-center rounded-full bg-note-yellow px-5 py-2 text-xs font-semibold text-ink transition-transform hover:-translate-y-[2px]"
          >
            Submit another photo
          </button>
        ) : null}

        <div aria-live="polite" className="mt-1">
          {successMsg ? <p className="text-xs font-medium text-emerald-400">{successMsg}</p> : null}
          {error ? <p className="text-xs text-note-pink">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
