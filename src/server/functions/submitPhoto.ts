import { createServerFn } from "@tanstack/react-start";
import { checkSubmissionRateLimit } from "@/server/security/rateLimiter";
import { getServerWixClient, isServerWixConfigured } from "@/server/wix/serverClient";
import { isWixConfigured } from "@/lib/cms/wixClient";

const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_PHOTO_SIZE = 8 * 1024 * 1024; // 8MB

export interface PhotoUploadInput {
  base64: string;
  fileName: string;
  mimeType: string;
  title?: string | undefined;
}

function sanitizeFileName(name: string): string {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return safe.length > 0 ? safe : `photo-${Date.now()}.jpg`;
}

function detectImageMime(
  buffer: Buffer,
): "image/jpeg" | "image/png" | "image/gif" | "image/webp" | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  const header = buffer.toString("ascii", 0, 6);
  if (header === "GIF87a" || header === "GIF89a") {
    return "image/gif";
  }
  const riff = buffer.toString("ascii", 0, 4);
  const webp = buffer.toString("ascii", 8, 12);
  if (riff === "RIFF" && webp === "WEBP") {
    return "image/webp";
  }
  return null;
}

export const submitPhotoServerFn = createServerFn({ method: "POST" })
  .validator((data: unknown): PhotoUploadInput => {
    console.log("[PHOTO] validator entered");
    if (!data || typeof data !== "object") {
      throw new Error("Invalid payload");
    }
    const { base64, fileName, mimeType, title } = data as Partial<PhotoUploadInput>;
    if (!base64 || typeof base64 !== "string") throw new Error("Base64 file data required.");
    if (!fileName || typeof fileName !== "string") throw new Error("Filename required.");
    if (!mimeType || !ALLOWED_PHOTO_TYPES.includes(mimeType)) {
      throw new Error("Unsupported image format. Allowed: JPEG, PNG, WEBP, GIF.");
    }
    return { base64, fileName, mimeType, title };
  })
  .handler(async ({ data }: { data: PhotoUploadInput }) => {
    console.log("[PHOTO] server function entered");
    console.log("[PHOTO] payload received", {
      hasBase64: Boolean(data?.base64),
      base64Length: data?.base64?.length,
      fileName: data?.fileName,
      mimeType: data?.mimeType,
      title: data?.title,
    });

    console.log("[PHOTO] ENV CHECK:", {
      "WIX_API_KEY present": Boolean(
        process.env?.["WIX_API_KEY"] || import.meta.env?.["WIX_API_KEY"],
      ),
      "WIX_SITE_ID present": Boolean(
        process.env?.["WIX_SITE_ID"] || import.meta.env?.["WIX_SITE_ID"],
      ),
      "VITE_WIX_CLIENT_ID present": Boolean(
        process.env?.["VITE_WIX_CLIENT_ID"] || import.meta.env?.["VITE_WIX_CLIENT_ID"],
      ),
    });

    const rateLimit = checkSubmissionRateLimit();
    if (!rateLimit.allowed) {
      console.log("[PHOTO] FAILURE AT RATE_LIMIT");
      return { success: false, error: rateLimit.error };
    }

    if (!isWixConfigured()) {
      console.log("[PHOTO] FAILURE AT WIX_NOT_CONFIGURED");
      return { success: false, error: "Wix Client is not configured." };
    }

    if (!isServerWixConfigured()) {
      console.log("[PHOTO] FAILURE AT SERVER_WIX_NOT_CONFIGURED");
      return {
        success: false,
        error:
          "Server Wix credentials unconfigured. WIX_API_KEY and WIX_SITE_ID environment variables are required.",
      };
    }

    try {
      const serverClient = getServerWixClient();
      console.log("[PHOTO] Wix client created");

      const buffer = Buffer.from(data.base64, "base64");
      console.log("[PHOTO] BUFFER LENGTH:", buffer.length);
      console.log("[PHOTO] MAGIC BYTES HEX:", buffer.subarray(0, 16).toString("hex"));

      if (buffer.length > MAX_PHOTO_SIZE) {
        console.log("[PHOTO] FAILURE AT FILE_SIZE_LIMIT");
        return { success: false, error: "Image file exceeds 8 MB size limit." };
      }

      // Detect authentic image format from magic bytes
      const detectedMime = detectImageMime(buffer);
      console.log("[PHOTO] DETECTED MIME:", detectedMime);
      if (!detectedMime) {
        console.log("[PHOTO] FAILURE AT MAGIC_BYTES_VALIDATION");
        return {
          success: false,
          error: "File contents do not match the expected image format.",
        };
      }

      console.log("[PHOTO] validation passed");

      const extMap: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "image/webp": "webp",
      };

      const uploadMime = detectedMime;
      const targetExt = extMap[detectedMime] ?? "jpg";
      let uploadFileName = sanitizeFileName(data.fileName);
      const currentExt = uploadFileName.split(".").pop()?.toLowerCase();
      if (
        currentExt !== targetExt &&
        (currentExt === "jpg" ||
          currentExt === "jpeg" ||
          currentExt === "png" ||
          currentExt === "gif" ||
          currentExt === "webp")
      ) {
        uploadFileName = uploadFileName.replace(/\.[^.]+$/, "") + "." + targetExt;
      }

      console.log("[PHOTO] CALLING GENERATE_FILE_UPLOAD_URL...");
      // 1. Request signed upload URL from Wix Media Manager
      const { uploadUrl } = await serverClient.files.generateFileUploadUrl(uploadMime, {
        fileName: uploadFileName,
      });

      console.log("[PHOTO] upload URL generated:", Boolean(uploadUrl));
      if (!uploadUrl) {
        console.log("[PHOTO] FAILURE AT GENERATE_UPLOAD_URL_EMPTY");
        return { success: false, error: "Failed to generate Wix Media upload URL." };
      }

      console.log("[PHOTO] Media Manager upload started");
      // 2. Upload file via POST FormData to Wix signed upload URL
      const blob = new Blob([buffer], { type: uploadMime });
      const formData = new FormData();
      formData.append("file", blob, uploadFileName);

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });
      console.log("[PHOTO] Media Manager upload response status:", uploadRes.status);

      if (!uploadRes.ok) {
        const errText = await uploadRes.text().catch(() => "");
        console.error(
          "[PHOTO] Media Manager upload failed HTTP status:",
          uploadRes.status,
          "body:",
          errText,
        );
        return { success: false, error: "Failed to upload photo binary to Wix Media Manager." };
      }

      const resBodyText = await uploadRes.text();
      console.log("[PHOTO] Media Manager upload raw response:", resBodyText);

      let uploadData: Record<string, unknown> | Array<Record<string, unknown>> | undefined;
      try {
        uploadData = JSON.parse(resBodyText) as
          Record<string, unknown> | Array<Record<string, unknown>>;
      } catch (e) {
        console.error("[PHOTO] Failed to parse upload response JSON:", e);
        return { success: false, error: "Failed to parse Wix Media upload response." };
      }

      console.log("[PHOTO] Media Manager upload succeeded");

      // Handle array or object response from Wix Media upload
      const fileObj = (Array.isArray(uploadData) ? uploadData[0] : uploadData) as
        Record<string, unknown> | undefined;
      const file = fileObj?.["file"] as Record<string, unknown> | undefined;
      const fileId =
        (file?.["_id"] as string | undefined) ||
        (fileObj?.["_id"] as string | undefined) ||
        (file?.["id"] as string | undefined) ||
        (fileObj?.["id"] as string | undefined);
      let mediaRef =
        (file?.["url"] as string | undefined) || (fileObj?.["url"] as string | undefined);
      console.log("[PHOTO] fileId resolved:", fileId, "mediaRef resolved:", mediaRef);

      // 3. Handle File Ready state if fileId is returned
      if (fileId) {
        for (let attempt = 0; attempt < 10; attempt++) {
          try {
            const descriptor = await serverClient.files.getFileDescriptor(fileId);
            const stateStr = String(descriptor.state ?? "");
            if (stateStr === "READY" || stateStr === "OK") {
              console.log("[PHOTO] FILE READY");
              mediaRef = descriptor.url || mediaRef;
              break;
            }
            if (stateStr === "FAILED") {
              console.error("[PHOTO] Wix Media file state FAILED");
              return { success: false, error: "Wix Media file processing failed." };
            }
          } catch (descErr) {
            console.warn("[PHOTO] Polling descriptor error:", descErr);
          }
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      console.log("[PHOTO] uploaded file resolved:", mediaRef);

      if (
        !mediaRef ||
        typeof mediaRef !== "string" ||
        (!mediaRef.startsWith("wix:") && !mediaRef.startsWith("https://"))
      ) {
        console.error("[PHOTO] Invalid mediaRef format:", mediaRef);
        return { success: false, error: "Invalid media reference received from Wix." };
      }

      console.log("[PHOTO] CMS insert started");
      // 4. Insert CMS item with authentic media reference and SDK Date object
      const result = await serverClient.items.insert("PhotoSubmissions", {
        title: data.title?.trim() || uploadFileName,
        photoUrl: mediaRef,
        status: "pending",
        submittedAt: new Date(),
      });
      console.log("[PHOTO] CMS insert succeeded, id:", result._id);

      return { success: true, id: result._id };
    } catch (err: unknown) {
      console.error("[PHOTO SUBMIT ERROR]", err);
      return { success: false, error: "Unable to process photo submission right now." };
    }
  });
