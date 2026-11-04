import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { submitAudioSubmission } from "@/features/submissions/client/audioSubmitter";

function CustomAudioPlayer({ src, downloadExt }: { src: string; downloadExt: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const barHeights = [30, 65, 40, 85, 55, 95, 45, 75, 35, 65, 90, 55, 40, 80, 45];

  return (
    <div className="mt-2.5 w-full max-w-sm space-y-2">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Audio Player Bar */}
      <div className="flex h-10 w-full items-center gap-2 rounded-full border border-paper/20 bg-ink px-3 text-paper sm:gap-2.5">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-highlight text-ink transition-transform hover:scale-105"
        >
          {isPlaying ? (
            <span className="font-mono text-[10px] font-bold">❚❚</span>
          ) : (
            <span className="pl-0.5 font-mono text-[11px] font-bold">▶</span>
          )}
        </button>

        {/* Current Time */}
        <span className="font-mono text-[10px] tabular-nums text-paper/80">
          {formatTime(currentTime)}
        </span>

        {/* Progress Bar Range */}
        <div className="relative flex min-w-0 flex-1 items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            aria-label="Audio progress slider"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-paper/20 accent-highlight focus:outline-none"
          />
        </div>

        {/* Total Duration */}
        <span className="font-mono text-[10px] tabular-nums text-paper/80">
          {formatTime(duration)}
        </span>

        {/* Neon Yellow Waveform (Right Side of Player, replacing >> icon) */}
        <div aria-hidden="true" className="flex h-4 shrink-0 items-center gap-[2px] pl-1">
          {barHeights.map((h, i) => (
            <motion.span
              key={i}
              className="w-[2px] rounded-full bg-highlight"
              style={{ height: `${h}%`, transformOrigin: "bottom" }}
              animate={
                isPlaying && !shouldReduceMotion
                  ? { scaleY: [0.3, 1, 0.4, 0.85, 0.3] }
                  : { scaleY: 0.7 }
              }
              transition={
                isPlaying && !shouldReduceMotion
                  ? {
                      duration: 0.8 + (i % 4) * 0.15,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                      delay: i * 0.04,
                    }
                  : {}
              }
            />
          ))}
        </div>
      </div>

      {/* Download Link */}
      <div>
        <a
          href={src}
          download={`street-smart-note.${downloadExt}`}
          className="inline-flex rounded-full border border-paper/40 px-3 py-1 text-[11px] font-medium text-paper transition-colors hover:border-highlight hover:text-highlight"
        >
          Download
        </a>
      </div>
    </div>
  );
}

/** MediaRecorder capture with custom audio player containing neon-yellow waveform on the right side. */
export function AudioRecorder() {
  const [state, setState] = useState<"idle" | "recording" | "recorded" | "uploading" | "done">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [seconds, setSeconds] = useState(0);

  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      recorder.current?.stream.getTracks().forEach((t) => t.stop());
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  async function start() {
    setError(null);
    setSuccessMsg(null);
    setRecordedBlob(null);
    if (url) {
      URL.revokeObjectURL(url);
      setUrl(null);
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Recording isn't supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredTypes = [
        "audio/mp4",
        "audio/aac",
        "audio/wav",
        "audio/webm;codecs=opus",
        "audio/webm",
      ];
      const selectedType = preferredTypes.find(
        (t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t),
      );
      const rec = new MediaRecorder(stream, selectedType ? { mimeType: selectedType } : undefined);
      chunks.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };
      rec.onstop = () => {
        const mimeType = rec.mimeType?.split(";")[0] || selectedType || "audio/mp4";
        const blob = new Blob(chunks.current, { type: mimeType });
        setRecordedBlob(blob);
        setUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        setState("recorded");
      };
      rec.start();
      recorder.current = rec;
      setSeconds(0);
      setState("recording");
      timer.current = setInterval(() => {
        setSeconds((s) => {
          if (s >= 299) {
            if (timer.current) clearInterval(timer.current);
            rec.stop();
            return 300;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      setError("Microphone access was blocked. Check browser permissions.");
    }
  }

  function stop() {
    if (timer.current) clearInterval(timer.current);
    recorder.current?.stop();
  }

  function recordAgain() {
    setError(null);
    setSuccessMsg(null);
    setRecordedBlob(null);
    if (url) {
      URL.revokeObjectURL(url);
      setUrl(null);
    }
    setState("idle");
  }

  async function submit() {
    if (!recordedBlob || state === "uploading") return;
    setError(null);
    setSuccessMsg(null);
    setState("uploading");
    const result = await submitAudioSubmission(recordedBlob);
    if (result.status === "error") {
      setError(result.message);
      setState("recorded");
    } else {
      setSuccessMsg("Voice note submitted for review!");
      setState("done");
    }
  }

  const downloadExt = recordedBlob?.type?.includes("mp4")
    ? "mp4"
    : recordedBlob?.type?.includes("m4a")
      ? "m4a"
      : recordedBlob?.type?.includes("wav")
        ? "wav"
        : "webm";

  return (
    <div className="flex flex-col space-y-2.5">
      <h3 className="font-display text-base leading-tight text-highlight sm:text-lg">
        Share an Audio Recording
      </h3>
      <p className="text-xs leading-relaxed text-paper/75">
        Sometimes it&apos;s easier to tell a story than write it. Share your experience in your own
        voice.{" "}
        <Link to="/privacy" target="_blank" className="underline hover:text-highlight">
          Privacy Policy
        </Link>
      </p>

      <div className="pt-1">
        {state === "idle" ? (
          <button
            type="button"
            onClick={start}
            className="inline-flex min-h-[38px] items-center justify-center rounded-full bg-note-yellow px-5 py-2 text-xs font-semibold text-ink transition-transform hover:-translate-y-[2px] focus-visible:ring-2 focus-visible:ring-highlight"
          >
            Start Recording
          </button>
        ) : null}

        {state === "recording" ? (
          <button
            type="button"
            onClick={stop}
            className="inline-flex min-h-[38px] items-center justify-center rounded-full bg-note-yellow px-5 py-2 text-xs font-semibold text-ink transition-transform hover:-translate-y-[2px] focus-visible:ring-2 focus-visible:ring-highlight"
          >
            Stop Recording
          </button>
        ) : null}

        {state === "recorded" || state === "uploading" ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={state === "uploading"}
              onClick={recordAgain}
              className="inline-flex min-h-[36px] items-center justify-center rounded-full border border-paper/40 px-4 py-1.5 text-xs font-semibold text-paper transition-colors hover:border-highlight hover:text-highlight disabled:opacity-50"
            >
              Record again
            </button>
            <button
              type="button"
              disabled={state === "uploading"}
              onClick={submit}
              className="inline-flex min-h-[36px] items-center justify-center rounded-full bg-note-yellow px-5 py-1.5 text-xs font-semibold text-ink transition-transform hover:-translate-y-[2px] disabled:opacity-50"
            >
              {state === "uploading" ? "Submitting..." : "Submit"}
            </button>
          </div>
        ) : null}

        {state === "done" ? (
          <button
            type="button"
            onClick={start}
            className="inline-flex min-h-[38px] items-center justify-center rounded-full bg-note-yellow px-5 py-2 text-xs font-semibold text-ink transition-transform hover:-translate-y-[2px]"
          >
            Record again
          </button>
        ) : null}

        <div aria-live="polite" className="mt-2">
          {state === "recording" ? (
            <div className="flex items-center gap-2">
              <span className="size-2 animate-pulse rounded-full bg-note-pink" />
              <span className="font-mono text-xs text-paper">
                {String(Math.floor(seconds / 60)).padStart(2, "0")}:
                {String(seconds % 60).padStart(2, "0")}
              </span>
            </div>
          ) : null}
        </div>

        {/* Custom Audio Player with Neon Yellow Waveform on Right */}
        {url ? <CustomAudioPlayer src={url} downloadExt={downloadExt} /> : null}

        {/* Status Messages Positioned Below Player */}
        <div aria-live="polite" className="mt-2">
          {successMsg ? <p className="text-xs font-medium text-emerald-400">{successMsg}</p> : null}
          {error ? <p className="text-xs text-note-pink">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
