import { saveUserNote, type ArchiveNote } from "@/features/submissions/client/localNoteStorage";
import { submitStoryServerFn } from "@/server/functions/submitStory";
import { isWixConfigured } from "@/lib/cms/wixClient";

export async function submitStory(
  data: Omit<ArchiveNote, "id">,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const newNote: ArchiveNote = {
    ...data,
    id: `user-${Date.now()}`,
  };

  if (!isWixConfigured()) {
    console.log("[DIAGNOSTIC] WIX NOT CONFIGURED - FALLBACK TO LOCAL");
    saveUserNote(newNote);
    return { success: true, id: newNote.id };
  }

  try {
    const res = await submitStoryServerFn({
      data: {
        name: data.name,
        age: data.age,
        city: data.city,
        story: data.story,
        color: data.color,
        filterId: data.filterId,
      },
    });

    if (res.success) {
      saveUserNote(newNote);
      return { success: true, id: res.id ?? newNote.id };
    } else {
      return { success: false, error: res.error || "Unable to submit your story right now." };
    }
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error("[DIAGNOSTIC] WIX INSERT FAILED", errMessage);
    return { success: false, error: "Unable to submit your story right now." };
  }
}
