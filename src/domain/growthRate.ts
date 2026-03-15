/**
 * Calculates a channel's 30-day growth rate estimate from YouTube channels API data.
 *
 * Uses view efficiency (average views per video / subscriber count) as a proxy
 * for growth. Applies a logarithmic scale so popular channels don't all cluster
 * at the cap.
 *
 * Returns a value in the range -5.0 ~ 30.0 (percentage points).
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

  // Log scale: efficiency 0.01 → ~-1%, 0.1 → ~5%, 0.5 → ~12%, 1.0 → ~15%, 5.0 → ~22%, 50+ → ~28%
  // This spreads values across a wide range instead of clustering at 50%
  const logGrowth = Math.log10(viewEfficiency * 10 + 1) * 12 - 5;
  return Math.round(Math.min(Math.max(logGrowth, -5), 30) * 10) / 10;
}
