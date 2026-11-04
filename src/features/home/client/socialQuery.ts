import type { SocialPost } from "@/features/home/data/socialPosts";
import type { CmsResult } from "@/lib/cms/types";
import {
  ensureWixVisitorTokens,
  formatWixImageUrl,
  isWixConfigured,
  wixClient,
} from "@/lib/cms/wixClient";

export async function getSocialPosts(): Promise<CmsResult<SocialPost>> {
  if (!isWixConfigured()) {
    return { status: "unconfigured" };
  }
  try {
    await ensureWixVisitorTokens();

    // Try "SocialPosts" first, then fallback to camelCase "socialPosts"
    let rawItems: Record<string, unknown>[] = [];

    try {
      const response = await wixClient.items.query("SocialPosts").find();
      if (response.items && response.items.length > 0) {
        rawItems = response.items as Record<string, unknown>[];
      }
    } catch (err) {
      console.warn("Wix CMS query('SocialPosts') attempt:", err);
    }

    if (rawItems.length === 0) {
      try {
        const fallbackRes = await wixClient.items.query("socialPosts").find();
        if (fallbackRes.items && fallbackRes.items.length > 0) {
          rawItems = fallbackRes.items as Record<string, unknown>[];
        }
      } catch (fallbackErr) {
        console.warn("Wix CMS query('socialPosts') attempt:", fallbackErr);
      }
    }

    if (rawItems.length === 0) {
      return { status: "empty" };
    }

    // Filter out items that are explicitly set to draft or archived (case-insensitive)
    const activeItems = rawItems
      .filter((item) => {
        const status = String(item["status"] ?? "")
          .trim()
          .toLowerCase();
        if (status === "draft" || status === "archived") return false;
        return true;
      })
      .sort((a, b) => {
        // If sortOrder is provided on both, sort by sortOrder ascending
        const orderA = typeof a["sortOrder"] === "number" ? a["sortOrder"] : null;
        const orderB = typeof b["sortOrder"] === "number" ? b["sortOrder"] : null;
        if (orderA !== null && orderB !== null) return orderA - orderB;
        if (orderA !== null) return -1;
        if (orderB !== null) return 1;

        // Fallback: sort by date or createdDate if available
        const dateA = a["publishedDate"] ?? a["date"] ?? a["_createdDate"];
        const dateB = b["publishedDate"] ?? b["date"] ?? b["_createdDate"];
        if (dateA && dateB) {
          const timeA = new Date(dateA as string).getTime();
          const timeB = new Date(dateB as string).getTime();
          if (!isNaN(timeA) && !isNaN(timeB)) return timeB - timeA;
        }
        return 0;
      });

    if (activeItems.length === 0) {
      return { status: "empty" };
    }

    const data: SocialPost[] = activeItems.map((item, index) => {
      const titleVal = (item["title"] ??
        item["name"] ??
        item["caption"] ??
        item["title1"] ??
        "") as string;

      const imageVal = formatWixImageUrl(
        item["image"] ??
          item["postImage"] ??
          item["photo"] ??
          item["imageFile"] ??
          item["media"] ??
          item["posterImage"] ??
          item["poster"],
      );

      const dateVal = (item["publishedDate"] ?? item["date"] ?? item["postDate"] ?? "") as string;

      const instaVal = (item["instagramUrl"] ??
        item["link"] ??
        item["url"] ??
        item["instagram"] ??
        "") as string;

      return {
        id: (item["_id"] as string | undefined) ?? `social-${index}`,
        title: titleVal,
        image: imageVal,
        platform: "Instagram" as const,
        date: dateVal,
        instagramUrl: instaVal,
      };
    });

    return { status: "success", data };
  } catch (error) {
    console.error("Wix CMS Social Posts fetch failed:", error);
    return { status: "error", message: "Community posts couldn't be loaded right now." };
  }
}
