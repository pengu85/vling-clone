import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "인기 급상승 동영상",
  description: "YouTube 인기 급상승 동영상을 실시간으로 확인하세요.",
};

export default function TrendingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
