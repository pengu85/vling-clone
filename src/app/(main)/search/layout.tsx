import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "채널 검색",
  description: "유튜브 채널을 검색하고 상세 분석 데이터를 확인하세요.",
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
