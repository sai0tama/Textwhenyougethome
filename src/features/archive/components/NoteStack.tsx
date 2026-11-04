import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { noteColorClass, rotationFromId } from "@/components/ui/StickyNote";
import type { ArchiveNote } from "@/features/submissions/client/localNoteStorage";
import type { FilterId } from "@/shared/filters";
import { getApprovedStories } from "@/features/archive/client/archiveQuery";
import type { CmsResult } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

const spring = { type: "spring" as const, stiffness: 240, damping: 28 };

export function NoteStack({ activeFilter }: { activeFilter: FilterId | null }) {
  const [result, setResult] = useState<CmsResult<ArchiveNote> | null>(null);

  useEffect(() => {
    let active = true;
    function load() {
      setResult(null);
      setOrder([]);
      getApprovedStories(activeFilter).then((res) => {
        if (active) setResult(res);
      });
    }
    load();
    window.addEventListener("street-smart-note-added", load);
    return () => {
      active = false;
      window.removeEventListener("street-smart-note-added", load);
    };
  }, [activeFilter]);

  const pool = useMemo(() => (result?.status === "success" ? result.data : []), [result]);

  const [order, setOrder] = useState<string[]>([]);

  const stack = useMemo(() => {
    const ids = pool.map((n) => n.id);
    const front = order.filter((id) => ids.includes(id));
    return [...ids.filter((id) => !front.includes(id)), ...front];
  }, [pool, order]);

  function bringToFront(id: string) {
    setOrder((prev) => [...prev.filter((x) => x !== id), id]);
  }

  function random() {
    const ids = pool.map((n) => n.id);
    if (ids.length < 2) return;
    const current = stack[stack.length - 1];
    const others = ids.filter((id) => id !== current);
    const pick = others[Math.floor(Math.random() * others.length)];
    if (pick) bringToFront(pick);
  }

  function renderStackContent() {
    if (!result) {
      return (
        <div className="pt-20 text-center font-hand text-2xl text-paper/70 animate-pulse">
          Loading stories...
        </div>
      );
    }

    if (result.status === "unconfigured") {
      return (
        <div className="pt-20 text-center font-hand text-2xl text-paper/70">
          CMS not configured. Add VITE_WIX_CLIENT_ID to connect to Wix.
        </div>
      );
    }

    if (result.status === "error") {
      return (
        <div className="pt-20 text-center font-hand text-2xl text-paper/70">{result.message}</div>
      );
    }

    if (result.status === "empty") {
      return (
        <div className="pt-20 text-center font-hand text-2xl text-paper/70">
          No approved stories yet.
        </div>
      );
    }

    if (pool.length === 0) {
      return (
        <div className="pt-20 text-center font-hand text-2xl text-paper/70">
          No notes under this filter yet.
        </div>
      );
    }

    return stack.map((id, index) => {
      const note = pool.find((n) => n.id === id);
      if (!note) return null;
      const depth = stack.length - 1 - index;
      const rotate = rotationFromId(note.id, 7);
      const hasAge = Boolean(note.age && typeof note.age === "number" && note.age > 0);
      const authorInfo = [
        note.name ? `${note.name}${hasAge ? `, ${note.age}` : ""}` : "",
        note.city,
      ]
        .filter(Boolean)
        .join(" · ");

      return (
        <motion.button
          key={note.id}
          type="button"
          onClick={() => bringToFront(note.id)}
          animate={{
            rotate: depth === 0 ? rotate * 0.35 : rotate,
            x: depth * -14 + 22,
            y: depth * 12,
            scale: 1 - depth * 0.03,
            zIndex: index + 1,
          }}
          whileHover={{ y: depth * 12 - 6 }}
          transition={spring}
          className={cn(
            "grain absolute left-1/2 top-0 w-[min(80vw,520px)] -translate-x-1/2 rounded-[2px] p-5 text-left text-ink physical-shadow sm:p-9",
            noteColorClass[note.color],
          )}
          style={{ height: "82%" }}
        >
          <p className="font-hand leading-snug [font-size:clamp(1.3rem,5.6vw,2rem)]">
            “{note.story}”
          </p>
          <p className="absolute bottom-5 left-5 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/70 sm:bottom-9 sm:left-9 sm:text-xs">
            {authorInfo}
          </p>
        </motion.button>
      );
    });
  }

  return (
    <section className="bg-ink px-4 pb-16 sm:px-8 sm:pb-24">
      <div className="mx-auto w-full max-w-[1400px]">
        {/* Sticky Notes Stack Container */}
        <div className="relative mx-auto h-[400px] w-[min(92vw,760px)] max-w-full sm:h-[440px] md:h-[460px]">
          {renderStackContent()}

          {/* Circular Neon Yellow "read a random one" Button Positioned Next to Stack */}
          <motion.button
            type="button"
            onClick={random}
            whileHover={{ scale: 1.08, rotate: -3 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute right-0 bottom-1 z-20 flex size-20 items-center justify-center rounded-full bg-highlight p-2 text-center physical-shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight sm:right-2 sm:bottom-2 sm:size-24 md:right-4 md:bottom-4"
            aria-label="Read a random note"
          >
            <span className="font-mono text-[9px] font-bold uppercase leading-tight tracking-wider text-ink sm:text-[11px]">
              read a<br />
              random
              <br />
              one
            </span>
          </motion.button>
        </div>

        {/* Full-width Thin Horizontal Divider Line Below Composition */}
        <div className="mt-8 w-full border-t border-paper/20 sm:mt-12" aria-hidden="true" />
      </div>
    </section>
  );
}
