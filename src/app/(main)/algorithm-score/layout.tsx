import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "알고리즘 점수 검색",
  description: "유튜브 채널의 알고리즘 점수를 분석하고 최적화 방향을 확인하세요.",
};

export default function AlgorithmScoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
