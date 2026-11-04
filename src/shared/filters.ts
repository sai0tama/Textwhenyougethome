export type FilterId =
  "safety-care" | "known-distance" | "after-dark" | "random-incident" | "walking-us" | "others";

export type Filter = { id: FilterId; label: string; archiveLabel: string };

export const filters: Filter[] = [
  { id: "safety-care", label: "Safety & Care", archiveLabel: "Safety & Care" },
  { id: "known-distance", label: "Across distance", archiveLabel: "Across distance" },
  { id: "after-dark", label: "After dark", archiveLabel: "After dark" },
  { id: "random-incident", label: "A random incident", archiveLabel: "A random incident" },
  { id: "walking-us", label: "Looking out", archiveLabel: "Looking out" },
  { id: "others", label: "Others", archiveLabel: "Others" },
];
