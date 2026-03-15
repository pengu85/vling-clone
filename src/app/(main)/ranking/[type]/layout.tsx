import type { Metadata } from "next";

const TYPE_LABELS: Record<string, string> = {
  subscriber: "구독자",
  view: "조회수",
  growth: "성장률",
  revenue: "수익",
  superchat: "슈퍼챗",
};

interface Props {
  params: Promise<{ type: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  const label = TYPE_LABELS[type] ?? type;
  return {
    title: `${label} 순위 | 블링`,
    description: `유튜브 채널 ${label} 순위를 확인하세요. 카테고리별 실시간 랭킹 데이터를 제공합니다.`,
  };
}

export default function RankingTypeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
