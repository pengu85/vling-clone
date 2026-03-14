import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "썸네일 A/B 분석기",
  description:
    "유튜브 썸네일을 AI로 분석하여 클릭률 높은 패턴을 찾아드립니다.",
};

export default function ThumbnailAnalyzerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
