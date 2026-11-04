import { createServerFn } from "@tanstack/react-start";
import type { NoteColor } from "@/features/submissions/client/localNoteStorage";
import type { FilterId } from "@/shared/filters";
import { checkSubmissionRateLimit } from "@/server/security/rateLimiter";
import { getServerWixClient, isServerWixConfigured } from "@/server/wix/serverClient";
import { isWixConfigured } from "@/lib/cms/wixClient";
import { invalidateStatisticsCache } from "@/server/functions/getArchiveStatistics";

export interface StorySubmissionInput {
  name?: string | undefined;
  age?: number | undefined;
  city?: string | undefined;
  story: string;
  color?: NoteColor | undefined;
  filterId?: FilterId | undefined;
}

function formatThemeTagForCms(filterId?: FilterId): string {
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
    default:
      return "Safety & Care";
  }
}

export const submitStoryServerFn = createServerFn({ method: "POST" })
  .validator((data: unknown): StorySubmissionInput => {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid payload");
    }
    const { name, age, city, story, color, filterId } = data as Partial<StorySubmissionInput>;

    if (!story || typeof story !== "string" || story.trim().length === 0) {
      throw new Error("Story text is required.");
    }

    if (story.length > 5000) {
      throw new Error("Story text exceeds length limit.");
    }

    return {
      name: typeof name === "string" ? name.trim() : undefined,
      age: typeof age === "number" && Number.isFinite(age) ? age : undefined,
      city: typeof city === "string" ? city.trim() : undefined,
      story: story.trim(),
      color: color,
      filterId: filterId,
    };
  })
  .handler(async ({ data }: { data: StorySubmissionInput }) => {
    console.log("[STORY] SERVER FUNCTION START");

    const rateLimit = checkSubmissionRateLimit();
    if (!rateLimit.allowed) {
      console.log("[STORY] FAILURE AT RATE_LIMIT");
      return { success: false, error: rateLimit.error };
    }

    if (!isWixConfigured()) {
      console.log("[STORY] FAILURE AT WIX_NOT_CONFIGURED");
      return { success: false, error: "Wix Client is not configured." };
    }

    if (!isServerWixConfigured()) {
      console.log("[STORY] FAILURE AT SERVER_WIX_NOT_CONFIGURED");
      return {
        success: false,
        error:
          "Server Wix credentials unconfigured. WIX_API_KEY and WIX_SITE_ID environment variables are required.",
      };
    }

    try {
      const serverClient = getServerWixClient();
      const themeTag = formatThemeTagForCms(data.filterId);

      console.log("[STORY] INSERTING INTO ArchiveStories...");
      const result = await serverClient.items.insert("ArchiveStories", {
        name: data.name ?? "Anonymous",
        age: data.age ?? 0,
        city: data.city ?? "",
        story: data.story,
        themeTag,
        color: data.color ?? "yellow",
        status: "pending",
        showOnMap: false,
        showInArchive: false,
        submittedAt: new Date().toISOString(),
      });

      console.log("[STORY] CMS INSERT SUCCESS, ID:", result._id);
      invalidateStatisticsCache();
      return { success: true, id: result._id };
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      console.error("[STORY] CMS INSERT FAILED:", errMessage);
      return { success: false, error: "Unable to submit your story right now." };
    }
  });
