import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "유튜브 순위",
  description: "구독자 수, 조회수 기준 유튜브 채널 순위를 확인하세요.",
};

export default function RankingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
