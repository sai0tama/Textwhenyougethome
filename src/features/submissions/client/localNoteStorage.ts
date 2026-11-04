import type { FilterId } from "@/shared/filters";

export type NoteColor = "orange" | "pink" | "yellow" | "blue" | "green" | "purple";

export type ArchiveNote = {
  id: string;
  name: string;
  age?: number | null | undefined;
  city: string;
  story: string;
  color: NoteColor;
  filterId: FilterId;
};

const LOCAL_STORAGE_KEY = "street_smart_user_notes";

export function getStoredUserNotes(): ArchiveNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUserNote(note: ArchiveNote) {
  if (typeof window === "undefined") return;
  try {
    const existing = getStoredUserNotes();
    const updated = [note, ...existing];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("street-smart-note-added"));
  } catch (err) {
    console.error("Failed to save note to localStorage:", err);
  }
}
