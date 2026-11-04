import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 submissions per IP per window

// Map of IP address -> array of submission timestamps
const ipTimestampMap = new Map<string, number[]>();

/**
 * Helper to safely extract the client IP address from server request context.
 */
function getClientIP(): string {
  try {
    const ip = getRequestIP();
    if (ip && typeof ip === "string" && ip.trim().length > 0) {
      return ip.trim();
    }
  } catch {
    // getRequestIP may throw if invoked outside request storage context (e.g. tests)
  }

  try {
    const cfIp = getRequestHeader("cf-connecting-ip");
    if (cfIp && cfIp.trim().length > 0) {
      return cfIp.trim();
    }

    const xForwardedFor = getRequestHeader("x-forwarded-for");
    if (xForwardedFor && xForwardedFor.trim().length > 0) {
      const firstIp = xForwardedFor.split(",")[0];
      if (firstIp && firstIp.trim().length > 0) {
        return firstIp.trim();
      }
    }

    const xRealIp = getRequestHeader("x-real-ip");
    if (xRealIp && xRealIp.trim().length > 0) {
      return xRealIp.trim();
    }
  } catch {
    // ignore
  }

  return "127.0.0.1";
}

/**
 * Checks rate limit for anonymous submission endpoints.
 * Returns { allowed: true } if under limit.
 * Returns { allowed: false, error: string } if rate limit exceeded.
 */
export function checkSubmissionRateLimit(): { allowed: boolean; error?: string } {
  const ip = getClientIP();
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const timestamps = ipTimestampMap.get(ip) ?? [];
  // Retain only timestamps within the current 15-minute sliding window
  const validTimestamps = timestamps.filter((t) => t > windowStart);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      error:
        "Rate limit exceeded. Maximum 10 submissions allowed per 15 minutes. Please try again later.",
    };
  }

  validTimestamps.push(now);
  ipTimestampMap.set(ip, validTimestamps);

  // Maintenance: periodic cleanup of inactive IP entries to limit memory usage
  if (ipTimestampMap.size > 5000) {
    for (const [key, tsList] of ipTimestampMap.entries()) {
      const freshList = tsList.filter((t) => t > windowStart);
      if (freshList.length === 0) {
        ipTimestampMap.delete(key);
      } else {
        ipTimestampMap.set(key, freshList);
      }
    }
  }

  return { allowed: true };
}
