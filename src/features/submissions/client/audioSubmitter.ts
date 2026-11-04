import type { CmsResult } from "@/lib/cms/types";
import { isWixConfigured } from "@/lib/cms/wixClient";
import { submitAudioServerFn } from "@/server/functions/submitAudio";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const base64 = res.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

function getExtensionForMimeType(mimeType: string): string {
  const first = mimeType.split(";")[0];
  const cleanMime = (first ?? mimeType).trim().toLowerCase();
  if (cleanMime === "audio/mp4" || cleanMime === "audio/m4a" || cleanMime === "audio/x-m4a")
    return "m4a";
  if (cleanMime === "audio/wav" || cleanMime === "audio/x-wav") return "wav";
  if (cleanMime === "audio/mp3" || cleanMime === "audio/mpeg") return "mp3";
  if (cleanMime === "audio/aac") return "aac";
  if (cleanMime === "audio/ogg") return "ogg";
  if (cleanMime === "audio/webm") return "webm";
  return "m4a";
}

export async function submitAudioSubmission(
  blob: Blob,
  title?: string,
): Promise<CmsResult<{ id: string; audioUrl: string }>> {
  if (!isWixConfigured()) {
    console.log("Wix Client ID not configured — audio capture preview active locally.");
    return { status: "unconfigured" };
  }

  try {
    const base64 = await blobToBase64(blob);
    const rawType = blob.type || "audio/mp4";
    const firstType = rawType.split(";")[0];
    const mimeType = (firstType ?? rawType).trim();
    const ext = getExtensionForMimeType(mimeType);
    const fileName = `recording-${Date.now()}.${ext}`;

    console.log("[CLIENT AUDIO] BLOB TYPE:", blob.type);
    console.log("[CLIENT AUDIO] BLOB SIZE:", blob.size);
    console.log("[CLIENT AUDIO] EXTRACTED MIME:", mimeType);
    console.log("[CLIENT AUDIO] GENERATED FILENAME:", fileName);

    const res = await submitAudioServerFn({
      data: {
        base64,
        fileName,
        mimeType,
        title: title?.trim() || `Voice Note ${new Date().toLocaleDateString()}`,
      },
    });

    if (res.success && res.id) {
      return {
        status: "success",
        data: [{ id: res.id, audioUrl: "" }],
      };
    }

    return {
      status: "error",
      message: res.error || "Audio submission failed. Please try again.",
    };
  } catch (err) {
    console.error("Failed to submit audio to Wix CMS:", err);
    return { status: "error", message: "Audio submission failed. Please try again." };
  }
}
