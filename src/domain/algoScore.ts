export const DEFAULT_AVG_LIKE_RATE = 0.035;
export const DEFAULT_AVG_COMMENT_RATE = 0.005;

export interface AlgoScoreInput {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  subscriberCount: number;
  publishedDaysAgo: number;
  videoCount: number;
}

/**
 * Individual video algorithm score (0-100).
 * Measures how well a single video is performing relative to channel size.
 */
export function calculateAlgoScore(input: AlgoScoreInput): number {
  const { viewCount, likeCount, commentCount, subscriberCount, publishedDaysAgo, videoCount } = input;

  if (subscriberCount === 0 || videoCount === 0) return 0;

  // View-to-subscriber ratio for this video (0.1 = decent, 1.0+ = viral)
  const vpvRatio = viewCount / Math.max(subscriberCount, 1);
  const viewScore = Math.min((vpvRatio / 0.5) * 35, 35);

  // Engagement: likes + comments relative to views
  const likeRate = likeCount / Math.max(viewCount, 1);
  const commentRate = commentCount / Math.max(viewCount, 1);
  const engagementScore = Math.min(((likeRate + commentRate) / 0.08) * 30, 30);

  // Freshness: newer videos score higher (max 20 points)
  const freshness = Math.max(0, 1 - publishedDaysAgo / 180);
  const freshnessScore = freshness * 20;

  // Scale bonus: larger channels get slight bonus (max 15 points)
  const scaleScore = Math.min((Math.log10(Math.max(subscriberCount, 1)) / 7) * 15, 15);

  return Math.round(Math.min(viewScore + engagementScore + freshnessScore + scaleScore, 100));
}

export interface ChannelAlgoScoreInput {
  avgViewsPerVideo: number;
  subscriberCount: number;
  avgLikeRate: number;       // avg(likeCount/viewCount) across recent videos
  avgCommentRate: number;    // avg(commentCount/viewCount) across recent videos
  videoCount: number;
  recentVideoCount: number;  // videos published in last 30 days
}

/**
 * Channel-level algorithm score (0-100).
 * Measures overall channel performance and algorithm favorability.
 */
export function calculateChannelAlgoScore(input: ChannelAlgoScoreInput): number {
  const { avgViewsPerVideo, subscriberCount, avgLikeRate, avgCommentRate, videoCount, recentVideoCount } = input;

  if (subscriberCount === 0) return 0;

  // 1. View performance: avg views per video vs subscriber count (35 pts max)
  const vpvRatio = avgViewsPerVideo / Math.max(subscriberCount, 1);
  const viewScore = Math.min((vpvRatio / 0.5) * 35, 35);

  // 2. Engagement quality (30 pts max)
  const totalEngagement = avgLikeRate + avgCommentRate;
  const engagementScore = Math.min((totalEngagement / 0.08) * 30, 30);

  // 3. Upload consistency: 4+ videos/month is ideal (20 pts max)
  const uploadFreq = recentVideoCount / 4;
  const consistencyScore = Math.min(uploadFreq * 20, 20);

  // 4. Channel scale bonus (15 pts max)
  const scaleScore = Math.min((Math.log10(Math.max(subscriberCount, 1)) / 7) * 15, 15);

  return Math.round(Math.min(viewScore + engagementScore + consistencyScore + scaleScore, 100));
}
