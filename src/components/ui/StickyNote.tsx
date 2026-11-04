/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { NoteColor } from "@/features/submissions/client/localNoteStorage";

export const noteColorClass: Record<NoteColor, string> = {
  orange: "bg-note-orange",
  pink: "bg-note-pink",
  yellow: "bg-note-yellow",
  blue: "bg-note-blue",
  green: "bg-note-mint",
  purple: "bg-note-purple",
};

/** Deterministic rotation from an id so layout never jumps between renders. */
export function rotationFromId(id: string, spread = 6) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) % 1000;
  return ((hash / 1000) * 2 - 1) * spread;
}

export function StickyNote({
  color = "yellow",
  rotate,
  className,
  children,
}: {
  color?: NoteColor;
  rotate?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grain relative rounded-[2px] p-5 text-ink physical-shadow",
        noteColorClass[color],
        className,
      )}
      style={rotate === undefined ? undefined : { rotate: `${rotate}deg` }}
    >
      {children}
    </div>
  );
}
