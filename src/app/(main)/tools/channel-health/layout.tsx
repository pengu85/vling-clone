import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "채널 건강검진 | 블링",
  description:
    "채널의 업로드 일관성, 조회수 안정성, 성장 모멘텀, 참여도, 쇼츠 의존도, 콘텐츠 다양성을 종합 진단합니다.",
  openGraph: {
    title: "채널 건강검진",
    description:
      "유튜브 채널의 종합 건강 상태를 진단하고 개선 포인트를 확인하세요.",
  },
};

export default function ChannelHealthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
