import { createServerFn } from "@tanstack/react-start";
import { checkSubmissionRateLimit } from "@/server/security/rateLimiter";
import { getServerWixClient, isServerWixConfigured } from "@/server/wix/serverClient";
import { isWixConfigured } from "@/lib/cms/wixClient";

export interface HostInquiryInput {
  email: string;
}

export type HostInquiryResponse = {
  success: boolean;
  status: "submitted" | "unconfigured" | "error";
  error?: string;
  id?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const submitHostInquiryServerFn = createServerFn({ method: "POST" })
  .validator((data: unknown): HostInquiryInput => {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid payload");
    }
    const { email } = data as Partial<HostInquiryInput>;

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      throw new Error("Please enter a valid email address.");
    }

    if (email.trim().length > 254) {
      throw new Error("Email address exceeds maximum length.");
    }

    return {
      email: email.trim().toLowerCase(),
    };
  })
  .handler(async ({ data }: { data: HostInquiryInput }): Promise<HostInquiryResponse> => {
    console.log("[HOST_INQUIRY] Received inquiry from:", data.email);

    // Rate limiting
    const rateLimit = checkSubmissionRateLimit();
    if (!rateLimit.allowed) {
      console.log("[HOST_INQUIRY] Rate limit exceeded for", data.email);
      return {
        success: false,
        status: "error",
        error: rateLimit.error ?? "Too many requests. Please try again later.",
      };
    }

    // Verify Wix credentials
    if (!isWixConfigured() || !isServerWixConfigured()) {
      console.log("[HOST_INQUIRY] CMS credentials not configured");
      return {
        success: false,
        status: "unconfigured",
        error: "Hosting inquiry service is temporarily unavailable. Please email us directly.",
      };
    }

    try {
      const serverClient = getServerWixClient();

      const result = await serverClient.items.insert("HostInquiries", {
        email: data.email,
        submittedAt: new Date().toISOString(),
        status: "new",
      });

      console.log("[HOST_INQUIRY] Successfully stored inquiry ID:", result._id);
      return {
        success: true,
        status: "submitted",
        id: result._id,
      };
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      console.error("[HOST_INQUIRY] Insert failed:", errMessage);
      return {
        success: false,
        status: "error",
        error: "Unable to send your inquiry right now. Please try again shortly.",
      };
    }
  });
