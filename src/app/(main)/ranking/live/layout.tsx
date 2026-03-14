import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "라이브 시청자 순위",
  description: "현재 라이브 중인 채널의 동시 시청자 수 순위를 확인하세요.",
};

export default function LiveRankingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
