import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "콜라보 궁합 점수 | 블링",
  description:
    "두 유튜브 채널의 콜라보 시너지를 분석합니다. 구독자 규모 균형, 카테고리 시너지, 참여도 매칭, 콘텐츠 스타일 유사도를 기반으로 궁합 점수를 제공합니다.",
  openGraph: {
    title: "콜라보 궁합 점수",
    description:
      "두 유튜브 채널의 콜라보 시너지를 분석하고 궁합 점수를 확인하세요.",
  },
};

export default function CollabScoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
