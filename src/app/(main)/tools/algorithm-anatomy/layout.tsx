import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "알고리즘 해부도",
  description:
    "YouTube 채널의 유입 경로와 알고리즘 패턴을 역추정합니다. 시간대별 조회수 히트맵, 키워드 성과 분석, 업로드 패턴, 알고리즘 추천 지수 제공.",
};

export default function AlgorithmAnatomyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
