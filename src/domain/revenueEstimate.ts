export interface RevenueInput {
  dailyViews: number;
  country: string;
  category: string;
}

// CPM in KRW (원화 기준)
const CPM_BY_COUNTRY: Record<string, number> = {
  US: 5400, GB: 4700, DE: 4000, FR: 3800, JP: 3400,
  KR: 2700, TW: 2400, BR: 2000, TH: 1350, VN: 1100,
  ID: 950, IN: 680, default: 2000,
};

const CPM_MULTIPLIER_BY_CATEGORY: Record<string, number> = {
  tech: 1.5, education: 1.3, beauty: 1.2, food: 1.1,
  gaming: 0.9, entertainment: 0.8, music: 0.7, kids: 0.6,
  autos: 1.3, film: 1.1, howto: 1.4, science: 1.3, lifestyle: 1.2, health: 1.5,
  default: 1.0,
};

export function estimateMonthlyRevenue(input: RevenueInput): number {
  const { dailyViews, country, category } = input;
  const baseCPM = CPM_BY_COUNTRY[country] ?? CPM_BY_COUNTRY.default;
  const multiplier = CPM_MULTIPLIER_BY_CATEGORY[category] ?? CPM_MULTIPLIER_BY_CATEGORY.default;
  const monthlyViews = dailyViews * 30;
  return Math.round((monthlyViews / 1000) * baseCPM * multiplier);
}

/**
 * 예상 협찬 단가 (원화 KRW)
 * 구독자 수와 참여율 기반 추정
 */
export function estimateAdPrice(subscriberCount: number, engagementRate: number): number {
  // 구독자 1만명당 약 30~50만원 기본
  const base = (subscriberCount / 10000) * 400000;
  const engagementMultiplier = 1 + Math.max(0, (engagementRate - 2)) * 0.15;
  return Math.round(Math.max(base * engagementMultiplier, 100000));
}
