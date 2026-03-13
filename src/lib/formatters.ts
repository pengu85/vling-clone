export function formatNumber(num: number): string {
  if (num >= 100000000) return `${(num / 100000000).toFixed(1)}억`;
  if (num >= 10000) return `${(num / 10000).toFixed(1)}만`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function formatCurrency(num: number, currency = "₩"): string {
  if (num >= 100000000) return `${currency}${(num / 100000000).toFixed(1)}억`;
  if (num >= 10000) return `${currency}${(num / 10000).toFixed(0)}만`;
  return `${currency}${num.toLocaleString()}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
  return `${Math.floor(diffDays / 365)}년 전`;
}

export function formatGrowthRate(rate: number): string {
  const prefix = rate >= 0 ? "+" : "";
  return `${prefix}${rate.toFixed(1)}%`;
}
