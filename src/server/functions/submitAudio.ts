import { createServerFn } from "@tanstack/react-start";
import { checkSubmissionRateLimit } from "@/server/security/rateLimiter";
import { getServerWixClient, isServerWixConfigured } from "@/server/wix/serverClient";
import { isWixConfigured } from "@/lib/cms/wixClient";

const ALLOWED_AUDIO_TYPES = [
  "audio/webm",
  "audio/mp3",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/m4a",
  "audio/mp4",
  "audio/aac",
  "audio/x-m4a",
];
const MAX_AUDIO_SIZE = 15 * 1024 * 1024; // 15MB

export interface AudioUploadInput {
  base64: string;
  fileName: string;
  mimeType: string;
  title?: string | undefined;
}

function sanitizeFileName(name: string): string {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return safe.length > 0 ? safe : `recording-${Date.now()}.webm`;
}

function isValidAudioBuffer(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false;
  const firstMime = mimeType.split(";")[0];
  const cleanMime = (firstMime ?? mimeType).trim().toLowerCase();

  if (cleanMime === "audio/webm") {
    return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
  }
  if (cleanMime === "audio/wav" || cleanMime === "audio/x-wav") {
    const riff = buffer.toString("ascii", 0, 4);
    const wave = buffer.toString("ascii", 8, 12);
    return riff === "RIFF" && wave === "WAVE";
  }
  if (cleanMime === "audio/ogg") {
    const ogg = buffer.toString("ascii", 0, 4);
    return ogg === "OggS";
  }
  if (cleanMime === "audio/mp3" || cleanMime === "audio/mpeg") {
    const id3 = buffer.toString("ascii", 0, 3);
    if (id3 === "ID3") return true;
    const b1 = buffer[1];
    return buffer[0] === 0xff && b1 !== undefined && (b1 & 0xe0) === 0xe0;
  }
  if (cleanMime === "audio/mp4" || cleanMime === "audio/m4a" || cleanMime === "audio/x-m4a") {
    const ftyp = buffer.toString("ascii", 4, 8);
    return ftyp === "ftyp";
  }
  if (cleanMime === "audio/aac") {
    const id3 = buffer.toString("ascii", 0, 3);
    if (id3 === "ID3") return true;
    return buffer[0] === 0xff;
  }
  return false;
}

export const submitAudioServerFn = createServerFn({ method: "POST" })
  .validator((data: unknown): AudioUploadInput => {
    console.log("[AUDIO] validator entered");
    if (!data || typeof data !== "object") {
      throw new Error("Invalid payload");
    }
    const { base64, fileName, mimeType, title } = data as Partial<AudioUploadInput>;
    if (!base64 || typeof base64 !== "string") throw new Error("Base64 file data required.");
    if (!fileName || typeof fileName !== "string") throw new Error("Filename required.");
    const firstMime = mimeType ? mimeType.split(";")[0] : undefined;
    const cleanMime = (firstMime ?? "").trim().toLowerCase();
    if (!cleanMime || !ALLOWED_AUDIO_TYPES.includes(cleanMime)) {
      throw new Error("Unsupported audio format.");
    }
    return { base64, fileName, mimeType: cleanMime, title };
  })
  .handler(async ({ data }: { data: AudioUploadInput }) => {
    console.log("[AUDIO] server function entered");
    console.log("[AUDIO] payload received", {
      hasBase64: Boolean(data?.base64),
      base64Length: data?.base64?.length,
      fileName: data?.fileName,
      mimeType: data?.mimeType,
      title: data?.title,
    });

    console.log("[AUDIO] ENV CHECK:", {
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
      console.log("[AUDIO] FAILURE AT RATE_LIMIT");
      return { success: false, error: rateLimit.error };
    }

    if (!isWixConfigured()) {
      console.log("[AUDIO] FAILURE AT WIX_NOT_CONFIGURED");
      return { success: false, error: "Wix Client is not configured." };
    }

    if (!isServerWixConfigured()) {
      console.log("[AUDIO] FAILURE AT SERVER_WIX_NOT_CONFIGURED");
      return {
        success: false,
        error:
          "Server Wix credentials unconfigured. WIX_API_KEY and WIX_SITE_ID environment variables are required.",
      };
    }

    try {
      const serverClient = getServerWixClient();
      console.log("[AUDIO] Wix client created");

      const buffer = Buffer.from(data.base64, "base64");
      console.log("[AUDIO] BUFFER LENGTH:", buffer.length);
      console.log("[AUDIO] MAGIC BYTES HEX:", buffer.subarray(0, 16).toString("hex"));

      if (buffer.length > MAX_AUDIO_SIZE) {
        console.log("[AUDIO] FAILURE AT FILE_SIZE_LIMIT");
        return { success: false, error: "Audio recording exceeds 15 MB size limit." };
      }

      // Verify binary buffer magic bytes match declared MIME type
      const isValid = isValidAudioBuffer(buffer, data.mimeType);
      console.log("[AUDIO] IS VALID BUFFER:", isValid);
      if (!isValid) {
        console.log("[AUDIO] FAILURE AT MAGIC_BYTES_VALIDATION");
        return {
          success: false,
          error: "Audio recording contents do not match the expected audio format.",
        };
      }

      console.log("[AUDIO] validation passed");

      const safeFileName = sanitizeFileName(data.fileName);
      const firstMime = data.mimeType.split(";")[0];
      const cleanMime = (firstMime ?? data.mimeType).trim().toLowerCase();
      let uploadMime = cleanMime;
      let uploadFileName = safeFileName;

      const extMap: Record<string, string> = {
        "audio/m4a": "m4a",
        "audio/mp4": "m4a",
        "audio/wav": "wav",
        "audio/mp3": "mp3",
        "audio/mpeg": "mp3",
        "audio/aac": "aac",
      };

      if (cleanMime === "audio/webm" || cleanMime === "audio/ogg" || cleanMime === "audio/mp4") {
        uploadMime = "audio/m4a";
        uploadFileName = safeFileName.replace(/\.(webm|ogg|mp4)$/i, ".m4a");
        if (!uploadFileName.endsWith(".m4a")) {
          uploadFileName += ".m4a";
        }
      } else if (extMap[cleanMime]) {
        const targetExt = extMap[cleanMime] ?? "m4a";
        const currentExt = uploadFileName.split(".").pop()?.toLowerCase();
        if (currentExt !== targetExt) {
          uploadFileName = uploadFileName.replace(/\.[^.]+$/, "") + "." + targetExt;
        }
      }

      console.log("[AUDIO] UPLOAD MIME:", uploadMime);
      console.log("[AUDIO] UPLOAD FILENAME:", uploadFileName);
      console.log("[AUDIO] CALLING GENERATE_FILE_UPLOAD_URL...");

      // 1. Request signed upload URL from Wix Media Manager
      const { uploadUrl } = await serverClient.files.generateFileUploadUrl(uploadMime, {
        fileName: uploadFileName,
      });

      console.log("[AUDIO] upload URL generated:", Boolean(uploadUrl));
      if (!uploadUrl) {
        return { success: false, error: "Failed to generate Wix Media upload URL." };
      }

      console.log("[AUDIO] Media Manager upload started");
      // 2. Upload audio file via POST FormData to Wix signed upload URL
      const blob = new Blob([buffer], { type: uploadMime });
      const formData = new FormData();
      formData.append("file", blob, uploadFileName);

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });
      console.log("[AUDIO] Media Manager upload response status:", uploadRes.status);

      if (!uploadRes.ok) {
        const errBody = await uploadRes.text().catch(() => "");
        console.error(
          "[AUDIO] Media Manager upload failed HTTP status:",
          uploadRes.status,
          "body:",
          errBody,
        );
        return { success: false, error: "Failed to upload audio binary to Wix Media Manager." };
      }

      const resBodyText = await uploadRes.text();
      console.log("[AUDIO] Media Manager upload raw response:", resBodyText);

      let uploadData: Record<string, unknown> | Array<Record<string, unknown>> | undefined;
      try {
        uploadData = JSON.parse(resBodyText) as
          Record<string, unknown> | Array<Record<string, unknown>>;
      } catch (e) {
        console.error("[AUDIO] Failed to parse upload response JSON:", e);
        return { success: false, error: "Failed to parse Wix Media upload response." };
      }

      console.log("[AUDIO] Media Manager upload succeeded");

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
      console.log("[AUDIO] fileId resolved:", fileId, "mediaRef resolved:", mediaRef);

      // 3. Handle File Ready state if fileId is returned
      if (fileId) {
        for (let attempt = 0; attempt < 10; attempt++) {
          try {
            const descriptor = await serverClient.files.getFileDescriptor(fileId);
            const stateStr = String(descriptor.state ?? "");
            if (stateStr === "READY" || stateStr === "OK") {
              mediaRef = descriptor.url || mediaRef;
              break;
            }
            if (stateStr === "FAILED") {
              console.error("[AUDIO] Wix Media file state FAILED");
              return { success: false, error: "Wix Media file processing failed." };
            }
          } catch (descErr) {
            console.warn("[AUDIO] Polling descriptor error:", descErr);
          }
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      console.log("[AUDIO] uploaded file resolved:", mediaRef);

      if (
        !mediaRef ||
        typeof mediaRef !== "string" ||
        (!mediaRef.startsWith("wix:") && !mediaRef.startsWith("https://"))
      ) {
        console.error("[AUDIO] Invalid mediaRef format:", mediaRef);
        return { success: false, error: "Invalid media reference received from Wix." };
      }

      console.log("[AUDIO] CMS insert started");
      // 4. Insert CMS item with authentic media reference and SDK Date object
      const result = await serverClient.items.insert("AudioSubmissions", {
        title: data.title?.trim() || safeFileName,
        audioUrl: mediaRef,
        status: "pending",
        submittedAt: new Date(),
      });

      console.log("[AUDIO] CMS insert succeeded, id:", result._id);
      return { success: true, id: result._id };
    } catch (err: unknown) {
      console.error("[AUDIO SUBMIT ERROR]", err);
      return { success: false, error: "Unable to process audio submission right now." };
    }
  });
