import type { ChannelSearchResult } from "@/types";

const CSV_HEADERS = [
  "채널명",
  "구독자",
  "일평균조회수",
  "성장률(%)",
  "알고리즘스코어",
  "예상수익(원)",
  "카테고리",
  "국가",
];

export function channelsToCSV(channels: ChannelSearchResult[]): string {
  const rows = channels.map((ch) => [
    `"${ch.title.replace(/"/g, '""')}"`,
    ch.subscriberCount,
    ch.dailyAvgViews,
    ch.growthRate30d,
    ch.algoScore,
    ch.estimatedRevenue,
    ch.category,
    ch.country,
  ]);

  const bom = "\uFEFF"; // UTF-8 BOM for Korean Excel compatibility
  return bom + [CSV_HEADERS.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
