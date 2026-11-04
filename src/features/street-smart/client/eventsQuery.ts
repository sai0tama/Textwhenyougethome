import type { PastEvent, UpcomingWalk } from "@/features/street-smart/data/events";
import type { CmsResult } from "@/lib/cms/types";
import {
  ensureWixVisitorTokens,
  formatWixImageUrl,
  isWixConfigured,
  wixClient,
} from "@/lib/cms/wixClient";

export type EventStatus = "published" | "completed";

export async function getUpcomingEvents(): Promise<CmsResult<UpcomingWalk>> {
  if (!isWixConfigured()) {
    return { status: "unconfigured" };
  }
  try {
    await ensureWixVisitorTokens();
    const response = await wixClient.items
      .query("Events")
      .ge("date", new Date())
      .ascending("date")
      .find();

    if (!response.items || response.items.length === 0) {
      return { status: "empty" };
    }

    const publishedItems = response.items.filter(
      (item) =>
        String(item["status"] ?? "")
          .trim()
          .toLowerCase() === "published",
    );

    if (publishedItems.length === 0) {
      return { status: "empty" };
    }

    const data: UpcomingWalk[] = publishedItems.map((item) => {
      const dateVal = item["date"] as string | undefined;
      const placeVal = (item["place"] ??
        item["location"] ??
        item["title1"] ??
        item["title"] ??
        "") as string;
      const cityVal = (item["city"] ?? "") as string;
      const regVal = (item["registrationUrl"] ?? "") as string;
      return {
        id: item._id ?? `event-${Math.random()}`,
        date: dateVal
          ? new Date(dateVal).toLocaleDateString("en-GB", { day: "numeric", month: "long" })
          : "TBA",
        place: placeVal,
        city: cityVal,
        registrationUrl: regVal,
      };
    });

    return { status: "success", data };
  } catch (error) {
    console.error("Wix CMS Upcoming Events fetch failed:", error);
    return { status: "error", message: "Upcoming walks couldn't be loaded right now." };
  }
}

const DEFAULT_POSITIONS = [
  { left: "8%", top: "1%", width: "20%", rotate: -6 },
  { left: "52%", top: "0%", width: "19%", rotate: 3 },
  { left: "30%", top: "40%", width: "20.5%", rotate: -4 },
  { left: "73%", top: "46%", width: "19%", rotate: 2 },
];

function extractText(val: unknown): string | undefined {
  if (!val) return undefined;
  if (typeof val === "string") {
    const clean = val
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return clean.length > 0 ? clean : undefined;
  }
  if (typeof val === "object" && val !== null) {
    const text = (val as { text?: string }).text;
    if (typeof text === "string" && text.trim().length > 0) {
      return text.trim();
    }
  }
  return undefined;
}

export async function getPastEvents(): Promise<CmsResult<PastEvent>> {
  if (!isWixConfigured()) {
    return { status: "unconfigured" };
  }
  try {
    await ensureWixVisitorTokens();
    const response = await wixClient.items.query("Events").ascending("date").find();

    if (!response.items || response.items.length === 0) {
      return { status: "empty" };
    }

    // 1. Normalize status and filter for completed events
    // 2. Filter for usable non-empty posterImage
    // 3. Sort by date ASCENDING
    const completedItems = response.items
      .filter(
        (item) =>
          String(item["status"] ?? "")
            .trim()
            .toLowerCase() === "completed",
      )
      .filter((item) => {
        const poster = formatWixImageUrl(item["posterImage"]);
        return Boolean(poster && poster.length > 0);
      })
      .sort((a, b) => {
        const timeA = a["date"] ? new Date(a["date"] as string).getTime() : 0;
        const timeB = b["date"] ? new Date(b["date"] as string).getTime() : 0;
        return timeA - timeB;
      });

    if (completedItems.length === 0) {
      return { status: "empty" };
    }

    // Rolling 4-event window: select the LAST 4 completed events (oldest -> newest)
    const rollingFour = completedItems.slice(-4);

    const data: PastEvent[] = rollingFour.map((item, index) => {
      const titleVal = (item["title1"] ?? item["title"] ?? "Street Smart Walk") as string;
      const placeVal = (item["place"] ?? "") as string;
      const cityVal = (item["city"] ?? "") as string;
      const captionVal = (item["caption"] ?? `${placeVal} · ${cityVal}`) as string;
      const posterVal = formatWixImageUrl(item["posterImage"]);
      const instaVal = (item["instagramUrl"] ?? "") as string;
      const whatWeLearnedVal = extractText(item["whatWeLearned"] ?? item["what_we_learned"]);
      const defaultPos = DEFAULT_POSITIONS[index % DEFAULT_POSITIONS.length] ?? {
        left: "10%",
        top: "10%",
        width: "20%",
        rotate: 0,
      };

      return {
        id: item._id ?? `past-${index}`,
        title: titleVal,
        caption: captionVal,
        image: posterVal,
        instagramUrl: instaVal,
        whatWeLearned: whatWeLearnedVal,
        pos: defaultPos,
      };
    });

    return { status: "success", data };
  } catch (error) {
    console.error("Wix CMS Past Events fetch failed:", error);
    return { status: "error", message: "Event posters couldn't be loaded right now." };
  }
}
