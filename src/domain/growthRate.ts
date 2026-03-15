/**
 * Calculates a channel's 30-day growth rate estimate from YouTube channels API data.
 *
 * Uses view efficiency (average views per video / subscriber count) as a proxy
 * for growth — a high ratio means the algorithm is pushing content beyond the
 * subscriber base, which correlates with channel growth.
 *
 * Returns a value in the range 0–50 (percentage points).
 * Uses only fields available from the YouTube channels API: totalViews, videoCount,
 * subscriberCount — no additional API calls required.
 */
export function calculateGrowthRate(
  totalViews: number,
  videoCount: number,
  subscriberCount: number
): number {
  if (subscriberCount === 0 || videoCount === 0) return 0;
  const avgViews = totalViews / videoCount;
  const viewEfficiency = avgViews / subscriberCount;
  // Convert to growth percentage: higher view efficiency = higher growth
  return Math.round(Math.min(viewEfficiency * 100, 50) * 10) / 10;
}
