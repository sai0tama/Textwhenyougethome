/**
 * Pure aggregation and normalization logic for homepage statistics.
 *
 * Metrics:
 * A. Stories Collected: Count of unique approved public archive stories.
 * B. Cities Represented: Number of distinct normalized cities from approved stories.
 * C. Walks and Workshops: Number of distinct completed events between Aug 1, 2025 and current date.
 * D. Themes Represented: Number of distinct normalized valid themes from approved stories.
 */

export interface ArchiveStatistics {
  storiesCount: number;
  citiesCount: number;
  walksCount: number;
  themesCount: number;
  timestamp?: number;
}

/**
 * Normalizes raw city strings into clean, canonical city identifiers.
 *
 * Rules:
 * - Trims whitespace and extracts city part before comma (e.g. "Tokyo, Japan" -> "tokyo")
 * - Handles sentence text accidentally pasted into city field
 * - Strips accents / diacritics (e.g. "São Paulo" -> "sao paulo", "Bogotá" -> "bogota")
 * - Maps city aliases (e.g. "bangalore" -> "bengaluru", "new delhi" -> "delhi")
 * - Handles "Country, City" exception (e.g. "Nigeria, Lagos" -> "lagos")
 * - Filters out standalone country names or empty inputs
 */
export function normalizeCity(rawCity: unknown): string | null {
  if (!rawCity) return null;
  let str = String(rawCity).trim();
  if (!str) return null;

  // 1. Take first line or text before sentence-ending punctuation if extra text is present
  const firstLine = str.split("\n")[0]?.split(/[.!?]/)[0]?.trim() || str;
  str = firstLine;

  const lower = str.toLowerCase();

  // 2. Exception: "Nigeria, Lagos" -> "lagos"
  if (lower.startsWith("nigeria, lagos")) {
    return "lagos";
  }

  // 3. Exception: "Singapore I'm tamil and..."
  if (lower.startsWith("singapore")) {
    return "singapore";
  }

  // 4. Standard "City, Country" or "City, State, Country" format -> extract City
  if (str.includes(",")) {
    const parts = str.split(",");
    str = (parts[0] ?? "").trim();
  }

  // 5. Remove accents / diacritics
  const normalized = str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  // 6. City aliases
  const CITY_ALIASES: Record<string, string> = {
    bangalore: "bengaluru",
    "new delhi": "delhi",
    bombay: "mumbai",
    calcutta: "kolkata",
    madras: "chennai",
  };

  if (CITY_ALIASES[normalized]) {
    return CITY_ALIASES[normalized]!;
  }

  // 7. Filter out standalone countries when no specific city was provided
  const COUNTRY_EXCLUSIONS = new Set(["india", "nigeria", "usa", "uk"]);
  if (COUNTRY_EXCLUSIONS.has(normalized)) {
    return null;
  }

  return normalized || null;
}

/**
 * Normalizes raw story theme tags into canonical theme IDs.
 * Recognizes the 6 canonical themes and allows dynamic new valid themes.
 */
export function normalizeTheme(rawTheme: unknown): string | null {
  if (!rawTheme) return null;
  const tag = String(rawTheme).trim().toLowerCase();
  if (!tag) return null;

  if (
    tag === "across-distance" ||
    tag === "across distance" ||
    tag === "known-distance" ||
    tag === "known distance"
  ) {
    return "known-distance";
  }
  if (
    tag === "looking-out" ||
    tag === "looking out" ||
    tag === "walking-us" ||
    tag === "walking us"
  ) {
    return "walking-us";
  }
  if (
    tag === "a-random-incident" ||
    tag === "a random incident" ||
    tag === "random-incident" ||
    tag === "random incident"
  ) {
    return "random-incident";
  }
  if (tag === "after-dark" || tag === "after dark") {
    return "after-dark";
  }
  if (tag === "safety-care" || tag === "safety & care") {
    return "safety-care";
  }
  if (tag === "others" || tag === "other") {
    return "others";
  }

  // Return dynamic new theme tag as normalized lowercase
  return tag;
}

/**
 * Checks whether an event is a valid completed walk/workshop within the date window.
 * Default window: August 1, 2025 through current date (now).
 */
export function isEligibleCompletedEvent(
  event: Record<string, unknown>,
  startDate = new Date("2025-08-01T00:00:00.000Z"),
  now = new Date(),
): boolean {
  const status = String(event["status"] ?? "")
    .trim()
    .toLowerCase();
  if (status !== "completed") return false;

  const rawDate = event["date"];
  if (!rawDate) return false;

  const evDate = new Date(rawDate as string | number | Date);
  if (isNaN(evDate.getTime())) return false;

  return evDate >= startDate && evDate <= now;
}

/**
 * Generates a deduplication key for events (title + YYYY-MM-DD + city).
 */
export function getEventDedupeKey(event: Record<string, unknown>): string {
  const title = String(event["title1"] ?? event["title"] ?? "")
    .trim()
    .toLowerCase();
  const rawDate = event["date"];
  const dateStr = rawDate
    ? new Date(rawDate as string | number | Date).toISOString().slice(0, 10)
    : "";
  const city = String(event["city"] ?? "")
    .trim()
    .toLowerCase();
  return `${title}|${dateStr}|${city}`;
}

/**
 * Aggregates all four statistics from raw CMS records:
 * 1. storiesCount: Approved public archive stories.
 * 2. citiesCount: Distinct normalized cities represented.
 * 3. walksCount: Completed events from Aug 1, 2025 to now (deduplicated).
 * 4. themesCount: Distinct normalized themes represented.
 */
export function calculateStatistics(
  stories: Record<string, unknown>[],
  events: Record<string, unknown>[],
  startDate = new Date("2025-08-01T00:00:00.000Z"),
  now = new Date(),
): ArchiveStatistics {
  const seenStoryIds = new Set<string>();
  const seenStoryTexts = new Set<string>();
  let approvedStoriesCount = 0;
  const citySet = new Set<string>();
  const themeSet = new Set<string>();

  for (const story of stories) {
    const status = String(story["status"] ?? "")
      .trim()
      .toLowerCase();
    // Exclude drafts, pending submissions, rejected records, etc.
    if (status !== "approved") continue;

    const id = story["_id"] ? String(story["_id"]) : undefined;
    const cleanText = String(story["story"] ?? "")
      .trim()
      .toLowerCase();

    // Prevent duplicate counting of the same story
    if (id && seenStoryIds.has(id)) continue;
    if (cleanText && seenStoryTexts.has(cleanText)) continue;

    if (id) seenStoryIds.add(id);
    if (cleanText) seenStoryTexts.add(cleanText);
    approvedStoriesCount++;

    // City representation
    const city = normalizeCity(story["city"] ?? story["country"]);
    if (city) citySet.add(city);

    // Theme representation
    const theme = normalizeTheme(story["themeTag"] ?? story["theme"]);
    if (theme) themeSet.add(theme);
  }

  // Events deduplication and date filtering
  const seenEvents = new Set<string>();
  let completedWalksCount = 0;

  for (const ev of events) {
    if (!isEligibleCompletedEvent(ev, startDate, now)) continue;

    const key = getEventDedupeKey(ev);
    if (seenEvents.has(key)) continue;
    seenEvents.add(key);
    completedWalksCount++;
  }

  return {
    storiesCount: approvedStoriesCount,
    citiesCount: citySet.size,
    walksCount: completedWalksCount,
    themesCount: themeSet.size,
    timestamp: Date.now(),
  };
}
