import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "키워드 추이 분석",
  description:
    "특정 키워드의 유튜브 검색 트렌드를 분석하고, 최대 3개 키워드를 동시에 비교하여 콘텐츠 전략을 수립하세요.",
};

export default function KeywordTrendsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
