export interface RevenueInput {
  dailyViews: number;
  country: string;
  category: string;
}

const CPM_BY_COUNTRY: Record<string, number> = {
  US: 4.0, GB: 3.5, DE: 3.0, FR: 2.8, JP: 2.5,
  KR: 2.0, TW: 1.8, BR: 1.5, TH: 1.0, VN: 0.8,
  ID: 0.7, IN: 0.5, default: 1.5,
};

const CPM_MULTIPLIER_BY_CATEGORY: Record<string, number> = {
  tech: 1.5, education: 1.3, beauty: 1.2, food: 1.1,
  gaming: 0.9, entertainment: 0.8, music: 0.7, kids: 0.6,
  default: 1.0,
};

export function estimateMonthlyRevenue(input: RevenueInput): number {
  const { dailyViews, country, category } = input;
  const baseCPM = CPM_BY_COUNTRY[country] ?? CPM_BY_COUNTRY.default;
  const multiplier = CPM_MULTIPLIER_BY_CATEGORY[category] ?? CPM_MULTIPLIER_BY_CATEGORY.default;
  const monthlyViews = dailyViews * 30;
  return Math.round((monthlyViews / 1000) * baseCPM * multiplier);
}

export function estimateAdPrice(subscriberCount: number, engagementRate: number): number {
  const base = subscriberCount * 0.01;
  const engagementMultiplier = 1 + (engagementRate - 2) * 0.1;
  return Math.round(Math.max(base * engagementMultiplier, 50000));
}
