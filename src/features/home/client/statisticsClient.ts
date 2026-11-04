import {
  getArchiveStatistics,
  type ArchiveStatistics,
  type StatisticsResponse,
} from "@/server/functions/getArchiveStatistics";

export type { ArchiveStatistics, StatisticsResponse };

/**
 * Client-side query wrapper for homepage archive statistics.
 */
export async function fetchArchiveStatistics(): Promise<StatisticsResponse> {
  return await getArchiveStatistics();
}
