import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "채널 비교",
  description: "두 유튜브 채널을 나란히 비교 분석하세요.",
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
