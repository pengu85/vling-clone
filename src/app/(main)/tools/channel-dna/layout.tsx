import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "채널 DNA 매칭 | 블링",
  description:
    "채널의 DNA(카테고리, 구독자 규모, 업로드 빈도, 성장 패턴)를 분석하고, 성장이 더 빠른 유사 채널을 자동 추천합니다.",
  openGraph: {
    title: "채널 DNA 매칭",
    description:
      "채널의 DNA를 분석하고 성장이 빠른 유사 채널을 벤치마킹하세요.",
  },
};

export default function ChannelDNALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
