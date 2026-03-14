import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "영상 순위",
  description: "조회수 기반 롱폼/Shorts 영상 순위를 확인하세요.",
};

export default function VideoRankingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
