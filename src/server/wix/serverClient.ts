import { createClient, ApiKeyStrategy } from "@wix/sdk";
import { items } from "@wix/data";
import { files } from "@wix/media";

if (typeof process !== "undefined" && typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // .env may not exist in production / cloudflare
  }
}

function getApiKey(): string {
  if (typeof process !== "undefined" && process.env?.["WIX_API_KEY"]) {
    return process.env["WIX_API_KEY"].trim();
  }
  if (typeof import.meta !== "undefined" && import.meta.env?.["WIX_API_KEY"]) {
    return String(import.meta.env["WIX_API_KEY"]).trim();
  }
  return "";
}

function getSiteId(): string {
  if (typeof process !== "undefined" && process.env?.["WIX_SITE_ID"]) {
    return process.env["WIX_SITE_ID"].trim();
  }
  if (typeof import.meta !== "undefined" && import.meta.env?.["WIX_SITE_ID"]) {
    return String(import.meta.env["WIX_SITE_ID"]).trim();
  }
  return "";
}

export function isServerWixConfigured(): boolean {
  return Boolean(getApiKey() && getSiteId());
}

export function getServerWixClient() {
  const apiKey = getApiKey();
  const siteId = getSiteId();

  if (!apiKey || !siteId) {
    throw new Error(
      "Server Wix credentials unconfigured: WIX_API_KEY and WIX_SITE_ID environment variables are required for media uploads.",
    );
  }

  return createClient({
    modules: { items, files },
    auth: ApiKeyStrategy({ apiKey, siteId }),
    useCDN: false,
  });
}
