import type { CmsResult } from "@/lib/cms/types";
import { isWixConfigured } from "@/lib/cms/wixClient";
import { submitPhotoServerFn } from "@/server/functions/submitPhoto";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const base64 = res.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export async function submitPhotoSubmission(
  file: File,
  title?: string,
): Promise<CmsResult<{ id: string; photoUrl: string }>> {
  if (!isWixConfigured()) {
    console.log("Wix Client ID not configured — photo capture preview active locally.");
    return { status: "unconfigured" };
  }

  try {
    const base64 = await fileToBase64(file);
    const fileName = file.name || `photo-${Date.now()}.jpg`;
    const mimeType = file.type || "image/jpeg";

    const res = await submitPhotoServerFn({
      data: {
        base64,
        fileName,
        mimeType,
        title: title?.trim() || file.name || `Photo ${new Date().toLocaleDateString()}`,
      },
    });

    if (res.success && res.id) {
      return {
        status: "success",
        data: [{ id: res.id, photoUrl: "" }],
      };
    }

    return {
      status: "error",
      message: res.error || "Photo submission failed. Please try again.",
    };
  } catch (err) {
    console.error("Failed to submit photo to Wix CMS:", err);
    return { status: "error", message: "Photo submission failed. Please try again." };
  }
}
