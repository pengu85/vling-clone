import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "요즘 뜨는",
  description: "최근 급성장 중인 유튜브 채널을 확인하세요.",
};

export default function RankingGrowthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
