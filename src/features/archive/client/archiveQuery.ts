import {
  getStoredUserNotes,
  type ArchiveNote,
  type NoteColor,
} from "@/features/submissions/client/localNoteStorage";
import type { FilterId } from "@/shared/filters";
import type { CmsResult } from "@/lib/cms/types";
import { isServerWixConfigured, getServerWixClient } from "@/server/wix/serverClient";
import { ensureWixVisitorTokens, isWixConfigured, wixClient } from "@/lib/cms/wixClient";

function normalizeColor(rawColor: unknown): NoteColor {
  const colorStr = String(rawColor ?? "")
    .toLowerCase()
    .trim();
  if (colorStr === "mint") return "green";
  if (colorStr === "purple" || colorStr === "lavender") return "purple";
  if (
    colorStr === "orange" ||
    colorStr === "pink" ||
    colorStr === "yellow" ||
    colorStr === "blue" ||
    colorStr === "green" ||
    colorStr === "purple"
  ) {
    return colorStr;
  }
  return "yellow";
}

function normalizeFilterId(rawTag: unknown): FilterId {
  const tagStr = String(rawTag ?? "")
    .toLowerCase()
    .trim();
  if (
    tagStr === "across-distance" ||
    tagStr === "across distance" ||
    tagStr === "known-distance" ||
    tagStr === "known distance"
  )
    return "known-distance";
  if (
    tagStr === "looking-out" ||
    tagStr === "looking out" ||
    tagStr === "walking-us" ||
    tagStr === "walking us"
  )
    return "walking-us";
  if (
    tagStr === "a-random-incident" ||
    tagStr === "a random incident" ||
    tagStr === "random-incident" ||
    tagStr === "random incident"
  )
    return "random-incident";
  if (tagStr === "after-dark" || tagStr === "after dark") return "after-dark";
  if (tagStr === "safety-care" || tagStr === "safety & care") return "safety-care";
  if (tagStr === "others" || tagStr === "other") return "others";
  return "safety-care";
}

async function fetchAllQueryItems(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  pageSize = 100,
): Promise<Record<string, unknown>[]> {
  let res = await query.limit(pageSize).find();
  const allItems: Record<string, unknown>[] = [...(res.items ?? [])];

  while (typeof res.hasNext === "function" && res.hasNext()) {
    res = await res.next();
    if (res.items && res.items.length > 0) {
      allItems.push(...res.items);
    } else {
      break;
    }
  }

  return allItems;
}

const ALL_TAG_IDS: FilterId[] = [
  "safety-care",
  "known-distance",
  "after-dark",
  "random-incident",
  "walking-us",
  "others",
];

function getCmsThemeTag(filterId: FilterId): string {
  switch (filterId) {
    case "safety-care":
      return "Safety & Care";
    case "known-distance":
      return "Across distance";
    case "after-dark":
      return "After dark";
    case "random-incident":
      return "A random incident";
    case "walking-us":
      return "Looking out";
    case "others":
      return "Others";
  }
}

async function fetchTagCandidates(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clientInstance: any,
  filterId: FilterId,
): Promise<ArchiveNote[]> {
  const cmsTag = getCmsThemeTag(filterId);
  try {
    const res = await clientInstance.items
      .query("ArchiveStories")
      .eq("status", "approved")
      .eq("showInArchive", true)
      .eq("themeTag", cmsTag)
      .limit(100)
      .find();

    return (res.items ?? []).map((item: Record<string, unknown>) => {
      const rawAge = Number(item["age"]);
      const age = typeof rawAge === "number" && !isNaN(rawAge) && rawAge > 0 ? rawAge : undefined;
      return {
        id: (item["_id"] ?? `story-${Math.random()}`) as string,
        name: (item["name"] ?? "Anonymous") as string,
        age,
        city: (item["city"] ?? item["country"] ?? "") as string,
        story: (item["story"] ?? "") as string,
        color: normalizeColor(item["color"]),
        filterId,
      };
    });
  } catch (error) {
    console.error(`Wix query for tag ${filterId} failed:`, error);
    return [];
  }
}

export async function getApprovedStories(
  filterId?: FilterId | null,
): Promise<CmsResult<ArchiveNote>> {
  const userNotes = getStoredUserNotes();

  const activeClient = isServerWixConfigured()
    ? getServerWixClient()
    : isWixConfigured()
      ? wixClient
      : null;

  if (!activeClient) {
    const filteredUser = filterId ? userNotes.filter((n) => n.filterId === filterId) : userNotes;
    if (filteredUser.length > 0) {
      return { status: "success", data: filteredUser };
    }
    return { status: "unconfigured" };
  }

  try {
    if (activeClient === wixClient) {
      await ensureWixVisitorTokens();
    }
    let selectedNotes: ArchiveNote[] = [];

    if (!filterId) {
      // Initial Load: 1 story per tag across all 6 tags (total 6)
      const tagPromises = ALL_TAG_IDS.map(async (tag) => {
        const candidates = await fetchTagCandidates(activeClient, tag);
        if (candidates.length === 0) return null;
        const pickIndex = Math.floor(Math.random() * candidates.length);
        return candidates[pickIndex];
      });

      const results = await Promise.all(tagPromises);
      selectedNotes = results.filter((n): n is ArchiveNote => n !== null);
    } else {
      // Specific Filter: 5 random stories from selected theme
      const candidates = await fetchTagCandidates(activeClient, filterId);
      if (candidates.length > 0) {
        const shuffled = [...candidates].sort(() => 0.5 - Math.random());
        selectedNotes = shuffled.slice(0, 5);
      }
    }

    const filteredUser = filterId ? userNotes.filter((n) => n.filterId === filterId) : userNotes;
    const allNotes = [...filteredUser, ...selectedNotes];

    if (allNotes.length === 0) {
      return { status: "empty" };
    }

    return { status: "success", data: allNotes };
  } catch (error) {
    console.error("Wix CMS getApprovedStories failed:", error);
    const filteredUser = filterId ? userNotes.filter((n) => n.filterId === filterId) : userNotes;
    if (filteredUser.length > 0) {
      return { status: "success", data: filteredUser };
    }
    return { status: "error", message: "Stories couldn't be loaded right now." };
  }
}

export async function getApprovedMapStories(): Promise<CmsResult<ArchiveNote>> {
  if (!isWixConfigured()) {
    return { status: "unconfigured" };
  }

  try {
    await ensureWixVisitorTokens();
    const query = wixClient.items
      .query("ArchiveStories")
      .eq("status", "approved")
      .eq("showOnMap", true)
      .descending("submittedAt");

    const items = await fetchAllQueryItems(query);

    if (items.length === 0) {
      return { status: "empty" };
    }

    const data: ArchiveNote[] = items.map((item, index) => {
      const rawAge = Number(item["age"]);
      const age = typeof rawAge === "number" && !isNaN(rawAge) && rawAge > 0 ? rawAge : undefined;
      return {
        id: ((item["_id"] as string | undefined) ?? `map-story-${index}`) as string,
        name: (item["name"] ?? "Anonymous") as string,
        age,
        city: (item["city"] ?? item["country"] ?? "") as string,
        story: (item["story"] ?? "") as string,
        color: normalizeColor(item["color"]),
        filterId: normalizeFilterId(item["themeTag"]),
      };
    });

    return { status: "success", data };
  } catch (error) {
    console.error("Wix CMS Map Stories fetch failed:", error);
    return { status: "error", message: "Map stories couldn't be loaded right now." };
  }
}

export async function getApprovedStoryCount(): Promise<number | null> {
  if (isServerWixConfigured()) {
    try {
      const serverClient = getServerWixClient();
      const count = await serverClient.items
        .query("ArchiveStories")
        .eq("status", "approved")
        .count();
      if (typeof count === "number" && count >= 0) {
        return count;
      }
    } catch (err) {
      console.error("Server Wix count query failed:", err);
    }
  }

  if (!isWixConfigured()) {
    return null;
  }

  try {
    await ensureWixVisitorTokens();
    const query = wixClient.items.query("ArchiveStories").eq("status", "approved");

    if (typeof query.count === "function") {
      const c = await query.count();
      if (typeof c === "number" && c >= 0) {
        return c;
      }
    }

    const res = await query.limit(1000).find();
    if (typeof res.totalCount === "number" && res.totalCount >= 0) {
      return res.totalCount;
    }

    const items = await fetchAllQueryItems(query);
    return items.length;
  } catch (error) {
    console.error("Wix CMS Approved Stories count fetch failed:", error);
    return null;
  }
}
