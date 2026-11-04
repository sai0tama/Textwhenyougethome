import { createClient, OAuthStrategy } from "@wix/sdk";
import { items } from "@wix/data";
import { files } from "@wix/media";

function getClientId(): string {
  if (typeof process !== "undefined" && process.env?.["VITE_WIX_CLIENT_ID"]) {
    return process.env["VITE_WIX_CLIENT_ID"].trim();
  }
  if (typeof import.meta !== "undefined" && import.meta.env?.["VITE_WIX_CLIENT_ID"]) {
    return import.meta.env["VITE_WIX_CLIENT_ID"].trim();
  }
  return "";
}

const clientId = getClientId();

export const wixClient = createClient({
  modules: { items, files },
  auth: OAuthStrategy({ clientId: clientId || "unconfigured" }),
  useCDN: false,
});

export function isWixConfigured(): boolean {
  const id = getClientId();
  return Boolean(
    id &&
    id !== "YOUR_WIX_HEADLESS_CLIENT_ID_HERE" &&
    id !== "placeholder-wix-client-id" &&
    id.length > 0,
  );
}

let tokenPromise: Promise<void> | null = null;

export async function ensureWixVisitorTokens(): Promise<void> {
  if (typeof window === "undefined" || !isWixConfigured()) return;

  const now = Math.floor(Date.now() / 1000);
  try {
    const currentTokens = wixClient.auth.getTokens();
    if (
      currentTokens?.accessToken?.value &&
      (currentTokens.accessToken.expiresAt ?? 0) > now + 60
    ) {
      return;
    }
  } catch (_err) {
    // Auth tokens not yet initialized
  }

  try {
    const cached = sessionStorage.getItem("wix_visitor_tokens");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.accessToken?.value && (parsed.accessToken.expiresAt ?? 0) > now + 60) {
        wixClient.auth.setTokens(parsed);
        return;
      }
    }
  } catch (_err) {
    // SessionStorage may be restricted or unavailable
  }

  if (!tokenPromise) {
    tokenPromise = (async () => {
      try {
        const tokens = await wixClient.auth.generateVisitorTokens();
        wixClient.auth.setTokens(tokens);
        try {
          sessionStorage.setItem("wix_visitor_tokens", JSON.stringify(tokens));
        } catch (_err) {
          // SessionStorage write may fail in private browsing
        }
      } catch (err) {
        console.warn("Wix visitor token generation warning:", err);
      } finally {
        tokenPromise = null;
      }
    })();
  }
  return tokenPromise;
}

export function formatWixImageUrl(imageField: unknown): string {
  if (!imageField) return "";

  let url = "";

  if (typeof imageField === "string") {
    url = imageField.trim();
  } else if (typeof imageField === "object" && imageField !== null) {
    const obj = imageField as Record<string, unknown>;
    if (typeof obj["url"] === "string") url = obj["url"];
    else if (typeof obj["src"] === "string") url = obj["src"];
    else if (typeof obj["fileUrl"] === "string") url = obj["fileUrl"];
  }

  if (!url) return "";

  if (url.startsWith("wix:image://")) {
    const match = url.match(/^wix:image:\/\/(?:v1\/)?([^/#?]+)/);
    if (match && match[1]) {
      return `https://static.wixstatic.com/media/${match[1]}`;
    }
  }

  return url;
}
