import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "유튜버 모니터",
  description: "관심 유튜버의 채널 지표를 실시간으로 모니터링하세요.",
};

export default function YoutuberTrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
