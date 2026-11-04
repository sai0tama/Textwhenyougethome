import { geoNaturalEarth1 } from "d3-geo";

import { cities, type City } from "../data/mapCities";
import type { ArchiveNote } from "../../submissions/client/localNoteStorage";
import type { FilterId } from "../../../shared/filters";

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 410;

// Proximity & interaction tuning constants
export const ACTIVATION_RADIUS = 36; // Screen pixels to activate marker on hover (~36px)
export const DEACTIVATION_RADIUS = 54; // Screen pixels before marker deactivates (hysteresis, ~54px)
export const SWITCH_MARGIN = 4; // Extra distance needed for competing marker to take over (~4px)
export const DISMISS_DELAY = 150; // Grace period (ms) before dismissing hover preview

const projection = geoNaturalEarth1()
  .scale(165)
  .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2 + 10]);

export type ProjectedCityPoint = {
  city: City;
  x: number;
  y: number;
};

export type ActiveStoryData = {
  id?: string | undefined;
  story: string;
  meta: string;
  name?: string | undefined;
  age?: number | undefined;
  cityName: string;
  country: string;
  totalStories: number;
  storyIndex: number;
};

export type BubbleLayout = {
  left: number;
  top: number;
  width: number;
  height: number;
  tail: "left" | "right";
  flipVertical: boolean;
  size: "desktop" | "mobile" | "small" | "tiny";
  markerScreenX: number;
  markerScreenY: number;
};

// Precompute projection for canonical cities once at module scope
export const CANONICAL_PROJECTED_CITIES: ProjectedCityPoint[] = cities
  .map((city) => {
    const projected = projection(city.coordinates);
    return projected ? { city, x: projected[0], y: projected[1] } : null;
  })
  .filter((v): v is ProjectedCityPoint => v !== null);

/**
 * Filter projected cities by active filter tags.
 */
export function filterProjectedCities(
  points: ProjectedCityPoint[],
  activeFilters: FilterId[] = [],
): ProjectedCityPoint[] {
  if (!activeFilters || activeFilters.length === 0) {
    return points;
  }
  return points.filter((p) => activeFilters.includes(p.city.filterId));
}

/**
 * Deterministically match approved CMS stories to canonical cities.
 * If multiple stories exist for a city, groups them and sorts deterministically
 * by ID descending so the most recent / highest ID is first.
 */
export function buildCityStoryIndex(cmsStories: ArchiveNote[]): Map<string, ArchiveNote[]> {
  const index = new Map<string, ArchiveNote[]>();

  // Normalize and group stories by city
  for (const story of cmsStories) {
    if (!story.city) continue;
    const key = story.city.toLowerCase().trim();
    if (!key) continue;

    const existing = index.get(key);
    if (!existing) {
      index.set(key, [story]);
    } else {
      existing.push(story);
    }
  }

  // Sort each array deterministically by id descending
  for (const list of index.values()) {
    list.sort((a, b) => b.id.localeCompare(a.id));
  }

  return index;
}

/**
 * Resolve story content for an active city point deterministically.
 * Supports multiple stories per location via storyOffset.
 */
export function resolveActiveStory(
  city: City,
  storyIndex: Map<string, ArchiveNote[]> | Map<string, ArchiveNote>,
  storyOffset = 0,
): ActiveStoryData {
  const normalizedName = city.name.toLowerCase().trim();
  let matches: ArchiveNote[] = [];

  const raw = storyIndex.get(normalizedName);
  if (raw) {
    matches = Array.isArray(raw) ? raw : [raw];
  } else {
    // Exact match failed; check for clean substring match
    for (const [key, noteOrNotes] of storyIndex.entries()) {
      if (
        key === normalizedName ||
        key.startsWith(normalizedName) ||
        normalizedName.startsWith(key)
      ) {
        matches = Array.isArray(noteOrNotes) ? noteOrNotes : [noteOrNotes];
        break;
      }
    }
  }

  if (matches.length > 0) {
    const totalStories = matches.length;
    const safeOffset = Math.abs(storyOffset) % totalStories;
    const match = matches[safeOffset] ?? matches[0]!;

    const meta = match.age
      ? `${match.name}, ${match.age} · ${city.name}`
      : `${match.name} · ${city.name}`;

    return {
      id: match.id,
      story: match.story,
      meta,
      name: match.name,
      age: match.age ?? undefined,
      cityName: city.name,
      country: city.country,
      totalStories,
      storyIndex: safeOffset,
    };
  }

  return {
    story: city.story,
    meta: `${city.name} · ${city.country}`,
    cityName: city.name,
    country: city.country,
    totalStories: 1,
    storyIndex: 0,
  };
}

/**
 * Calculate distance from point (px, py) to an axis-aligned rectangle (rx, ry, rw, rh).
 */
export function distanceToRect(
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): number {
  const dx = Math.max(rx - px, 0, px - (rx + rw));
  const dy = Math.max(ry - py, 0, py - (ry + rh));
  return Math.hypot(dx, dy);
}

/**
 * Check if a pointer is within the protected transit corridor connecting
 * an active marker and its open story bubble.
 */
export function isPointInCorridor(
  px: number,
  py: number,
  markerX: number,
  markerY: number,
  bubble: { left: number; top: number; width: number; height: number },
  buffer = 12,
): boolean {
  const minX = Math.min(markerX, bubble.left) - buffer;
  const maxX = Math.max(markerX, bubble.left + bubble.width) + buffer;
  const minY = Math.min(markerY, bubble.top) - buffer;
  const maxY = Math.max(markerY, bubble.top + bubble.height) + buffer;

  return px >= minX && px <= maxX && py >= minY && py <= maxY;
}

/**
 * Computes compact bubble dimensions and clamped coordinates within container boundaries.
 * Keeps bubbles from occluding other locations across the map.
 */
export function computeBubbleLayout(
  activePoint: ProjectedCityPoint,
  containerWidth: number,
  containerHeight: number,
): BubbleLayout | null {
  if (containerWidth <= 0 || containerHeight <= 0) return null;

  const mx = (activePoint.x / MAP_WIDTH) * containerWidth;
  const my = (activePoint.y / MAP_HEIGHT) * containerHeight;

  const isNarrowMobile = containerWidth < 360;
  const isMobile = containerWidth < 640;
  const isTablet = containerWidth >= 640 && containerWidth < 900;

  let bw: number;
  let bh: number;

  if (isNarrowMobile) {
    bw = Math.min(containerWidth - 16, 290);
    bh = Math.min(containerHeight - 14, 170);
  } else if (isMobile) {
    bw = Math.min(containerWidth - 20, 330);
    bh = Math.min(containerHeight - 16, 180);
  } else if (isTablet) {
    bw = Math.min(containerWidth - 36, 440);
    bh = Math.min(containerHeight - 20, 205);
  } else {
    // Desktop (1024px and wider): generous comic-book width
    bw = Math.min(containerWidth - 48, 540);
    bh = Math.min(containerHeight - 24, 225);
  }

  const pad = 8;

  // Determine vertical placement: prefer placing above marker if space permits
  const fitsAbove = my - bh - 8 >= pad;
  const fitsBelow = my + 8 + bh <= containerHeight - pad;

  let top: number;
  let flipVertical: boolean;

  if (fitsAbove) {
    top = my - bh - 8;
    flipVertical = false;
  } else if (fitsBelow) {
    top = my + 8;
    flipVertical = true;
  } else {
    top = Math.max(pad, Math.min(containerHeight - bh - pad, my - bh / 2));
    flipVertical = my < containerHeight / 2;
  }

  // Determine horizontal placement and tail orientation
  const placeRight = mx < containerWidth * 0.5;
  const tail: "left" | "right" = placeRight ? "left" : "right";
  // The angular comic speech tail tip is at 83.75% (or 16.25% when mirrored)
  const tipOffset = placeRight ? 0.1625 * bw : 0.8375 * bw;
  const rawLeft = mx - tipOffset;
  const left = Math.max(pad, Math.min(containerWidth - bw - pad, rawLeft));

  const size = isNarrowMobile
    ? ("tiny" as const)
    : isMobile
      ? ("mobile" as const)
      : isTablet
        ? ("small" as const)
        : ("desktop" as const);

  return {
    left,
    top,
    width: bw,
    height: bh,
    tail,
    flipVertical,
    size,
    markerScreenX: mx,
    markerScreenY: my,
  };
}
