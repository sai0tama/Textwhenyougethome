import { createServerFn } from "@tanstack/react-start";
import { getServerWixClient, isServerWixConfigured } from "@/server/wix/serverClient";
import { ensureWixVisitorTokens, isWixConfigured, wixClient } from "@/lib/cms/wixClient";
import {
  calculateStatistics,
  type ArchiveStatistics,
} from "@/features/home/utils/statisticsCalculator";

export type { ArchiveStatistics };

export type StatisticsResponse = {
  status: "success" | "error" | "unconfigured";
  data?: ArchiveStatistics;
  error?: string;
  fromCache?: boolean;
};

// In-memory cache at module scope (server process)
interface CacheEntry {
  stats: ArchiveStatistics;
  timestamp: number;
}

let cachedStats: CacheEntry | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

/**
 * Manually invalidate the in-memory statistics cache.
 * Called when a new story or event is submitted.
 */
export function invalidateStatisticsCache(): void {
  cachedStats = null;
}

/**
 * Fetches all items from a Wix query by following pagination cursors.
 */
async function fetchAllQueryItems(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  pageSize = 100,
): Promise<Record<string, unknown>[]> {
  let res = await query.limit(pageSize).find();
  const allItems: Record<string, unknown>[] = [...(res.items ?? [])];

  while (typeof res.hasNext === "function" && res.hasNext()) {
    res = await res.next();
    if (res.items && res.items.length > 0) {
      allItems.push(...res.items);
    } else {
      break;
    }
  }

  return allItems;
}

/**
 * Fetches current stories and events from Wix CMS and calculates live statistics.
 */
async function fetchAndCalculateLiveStatistics(): Promise<ArchiveStatistics> {
  const activeClient = isServerWixConfigured()
    ? getServerWixClient()
    : isWixConfigured()
      ? wixClient
      : null;

  if (!activeClient) {
    throw new Error("Wix CMS client is not configured.");
  }

  if (activeClient === wixClient) {
    await ensureWixVisitorTokens();
  }

  // Fetch approved stories and events in parallel
  const [stories, events] = await Promise.all([
    fetchAllQueryItems(activeClient.items.query("ArchiveStories").eq("status", "approved")),
    fetchAllQueryItems(activeClient.items.query("Events")),
  ]);

  const stats = calculateStatistics(stories, events);
  cachedStats = {
    stats,
    timestamp: Date.now(),
  };

  return stats;
}

/**
 * Server function to retrieve archive statistics.
 * Returns cached statistics if within TTL (60s).
 */
export const getArchiveStatisticsServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<StatisticsResponse> => {
    // 1. Check in-memory cache
    if (cachedStats && Date.now() - cachedStats.timestamp < CACHE_TTL_MS) {
      return {
        status: "success",
        data: cachedStats.stats,
        fromCache: true,
      };
    }

    // 2. Check configuration
    if (!isServerWixConfigured() && !isWixConfigured()) {
      return {
        status: "unconfigured",
        error: "Wix CMS credentials not configured.",
      };
    }

    // 3. Fetch live data
    try {
      const stats = await fetchAndCalculateLiveStatistics();
      return {
        status: "success",
        data: stats,
        fromCache: false,
      };
    } catch (err) {
      console.error("Failed to fetch live archive statistics:", err);

      // Graceful fallback to previous cached value during temporary CMS failure
      if (cachedStats) {
        return {
          status: "success",
          data: cachedStats.stats,
          fromCache: true,
        };
      }

      return {
        status: "error",
        error: err instanceof Error ? err.message : "Failed to load statistics",
      };
    }
  },
);

/**
 * Unified entry point callable from server loaders or client components.
 */
export async function getArchiveStatistics(): Promise<StatisticsResponse> {
  try {
    return await getArchiveStatisticsServerFn();
  } catch (err) {
    console.error("getArchiveStatistics failed:", err);
    if (cachedStats) {
      return {
        status: "success",
        data: cachedStats.stats,
        fromCache: true,
      };
    }
    return {
      status: "error",
      error: err instanceof Error ? err.message : "Failed to load statistics",
    };
  }
}
