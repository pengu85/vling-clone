export interface AlgoScoreInput {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  subscriberCount: number;
  publishedDaysAgo: number;
  videoCount: number;
}

export function calculateAlgoScore(input: AlgoScoreInput): number {
  const { viewCount, likeCount, commentCount, subscriberCount, publishedDaysAgo, videoCount } = input;

  if (subscriberCount === 0 || videoCount === 0) return 0;

  const viewRate = viewCount / subscriberCount;
  const likeRate = likeCount / Math.max(viewCount, 1);
  const commentRate = commentCount / Math.max(viewCount, 1);
  const freshness = Math.max(0, 1 - publishedDaysAgo / 365);
  const consistency = Math.min(videoCount / 100, 1);

  const score =
    viewRate * 30 +
    likeRate * 1000 * 20 +
    commentRate * 1000 * 15 +
    freshness * 20 +
    consistency * 15;

  return Math.min(Math.round(score), 100);
}
