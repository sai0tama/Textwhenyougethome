import { createServerFn } from "@tanstack/react-start";
import { checkSubmissionRateLimit } from "@/server/security/rateLimiter";
import { getServerWixClient, isServerWixConfigured } from "@/server/wix/serverClient";
import { isWixConfigured } from "@/lib/cms/wixClient";

export interface NewsletterSubmissionInput {
  email: string;
  consent: boolean;
}

export type NewsletterResponse = {
  success: boolean;
  status: "subscribed" | "duplicate" | "unconfigured" | "error";
  error?: string;
  id?: string;
  crmSynced?: boolean;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normalizes email address (trims whitespace, converts to lowercase)
 */
export function normalizeEmail(rawEmail: string): string {
  return rawEmail.trim().toLowerCase();
}

/**
 * Attempts to synchronize subscriber with Wix native Email Subscriptions API.
 * Uses official REST endpoint https://www.wixapis.com/email-marketing/v1/email-subscriptions
 * Falls back gracefully if the API key lacks Email Marketing scopes.
 */
async function syncWixEmailSubscription(
  email: string,
  apiKey: string,
  siteId: string,
): Promise<{ synced: boolean; status?: string; error?: string }> {
  try {
    // 1. First check if contact already has an email subscription status
    const queryRes = await fetch(
      "https://www.wixapis.com/email-marketing/v1/email-subscriptions/query",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
          "wix-site-id": siteId,
        },
        body: JSON.stringify({
          filter: {
            email: { $in: [email] },
          },
        }),
      },
    );

    if (queryRes.ok) {
      const queryData = (await queryRes.json()) as {
        emailSubscriptions?: Array<{ subscriptionStatus?: string }>;
      };
      const existingSub = queryData.emailSubscriptions?.[0];
      // If contact explicitly UNSUBSCRIBED in the past, Wix email marketing policy requires
      // maintaining that suppression unless a fresh explicit resubscription is performed.
      if (existingSub?.subscriptionStatus === "UNSUBSCRIBED") {
        console.log("[NEWSLETTER] Contact previously UNSUBSCRIBED, executing intentional opt-in");
      }
    }

    // 2. Upsert email subscription to SUBSCRIBED
    // Official Wix documentation specifies wrapping in "subscription"
    const upsertRes = await fetch(
      "https://www.wixapis.com/email-marketing/v1/email-subscriptions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
          "wix-site-id": siteId,
        },
        body: JSON.stringify({
          subscription: {
            email,
            subscriptionStatus: "SUBSCRIBED",
          },
        }),
      },
    );

    if (upsertRes.ok) {
      console.log("[NEWSLETTER] Wix native Email Subscription synced successfully for", email);
      return { synced: true, status: "SUBSCRIBED" };
    }

    const errText = await upsertRes.text();
    console.warn(
      `[NEWSLETTER] Wix Email Subscriptions API response ${upsertRes.status}:`,
      errText.slice(0, 200),
    );
    return { synced: false, error: `HTTP ${upsertRes.status}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[NEWSLETTER] Wix Email Subscriptions API sync exception:", msg);
    return { synced: false, error: msg };
  }
}

export const submitNewsletterServerFn = createServerFn({ method: "POST" })
  .validator((data: unknown): NewsletterSubmissionInput => {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid payload");
    }
    const { email, consent } = data as Partial<NewsletterSubmissionInput>;

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      throw new Error("A valid email address is required.");
    }

    if (email.trim().length > 254) {
      throw new Error("Email address exceeds maximum length.");
    }

    if (consent !== true) {
      throw new Error(
        "Please confirm that you agree to receive occasional newsletters and updates.",
      );
    }

    return {
      email: normalizeEmail(email),
      consent: true,
    };
  })
  .handler(async ({ data }: { data: NewsletterSubmissionInput }): Promise<NewsletterResponse> => {
    console.log("[NEWSLETTER] SUBMIT HANDLER START for", data.email);

    // Rate limiting
    const rateLimit = checkSubmissionRateLimit();
    if (!rateLimit.allowed) {
      console.log("[NEWSLETTER] RATE LIMIT EXCEEDED");
      return {
        success: false,
        status: "error",
        error: rateLimit.error ?? "Too many requests. Please try again later.",
      };
    }

    // Verify Wix configuration
    if (!isWixConfigured() || !isServerWixConfigured()) {
      console.log("[NEWSLETTER] WIX CREDENTIALS NOT CONFIGURED");
      return {
        success: false,
        status: "unconfigured",
        error:
          "Newsletter subscription is temporarily unavailable because CMS credentials are not configured.",
      };
    }

    try {
      const serverClient = getServerWixClient();
      const apiKey =
        (typeof process !== "undefined" ? process.env?.["WIX_API_KEY"] : "") ||
        (typeof import.meta !== "undefined" ? import.meta.env?.["WIX_API_KEY"] : "") ||
        "";
      const siteId =
        (typeof process !== "undefined" ? process.env?.["WIX_SITE_ID"] : "") ||
        (typeof import.meta !== "undefined" ? import.meta.env?.["WIX_SITE_ID"] : "") ||
        "";

      // Check if this email is already subscribed in the NewsletterSubscribers collection
      try {
        const existing = await serverClient.items
          .query("NewsletterSubscribers")
          .eq("email", data.email)
          .find();

        if (existing.items && existing.items.length > 0) {
          console.log("[NEWSLETTER] DUPLICATE SUBSCRIBER", data.email);
          return {
            success: false,
            status: "duplicate",
            error: "You're already subscribed to our newsletter.",
          };
        }
      } catch (queryErr) {
        // If collection doesn't exist yet or query fails, proceed to attempt insert
        console.warn("[NEWSLETTER] Query check warning:", queryErr);
      }

      // Sync with Wix native Email Subscriptions API if credentials available
      let crmSynced = false;
      if (apiKey && siteId) {
        const syncResult = await syncWixEmailSubscription(data.email, apiKey, siteId);
        crmSynced = syncResult.synced;
      }

      const now = new Date().toISOString();

      // Insert new subscriber record into CMS collection for automations and archive records
      const result = await serverClient.items.insert("NewsletterSubscribers", {
        email: data.email,
        subscribedAt: now,
        status: "active",
        consent: true,
        consentTimestamp: now,
        subscriptionSource: "website_homepage_form",
      });

      console.log("[NEWSLETTER] INSERT SUCCESS, ID:", result._id);
      return {
        success: true,
        status: "subscribed",
        id: result._id,
        crmSynced,
      };
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      console.error("[NEWSLETTER] CMS INSERT FAILED:", errMessage);
      return {
        success: false,
        status: "error",
        error: "Unable to process subscription right now. Please try again shortly.",
      };
    }
  });
