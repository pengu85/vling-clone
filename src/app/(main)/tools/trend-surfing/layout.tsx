import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "트렌드 서핑",
  description:
    "급상승 키워드와 블루오션 키워드를 실시간으로 탐지하여 유튜브 콘텐츠 기회를 선점하세요. 카테고리별 트렌드 분석과 경쟁도 평가 제공.",
};

export default function TrendSurfingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
