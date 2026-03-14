import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "댓글 감정 분석기",
  description:
    "유튜브 영상 댓글의 감정을 AI로 분석하여 긍정/부정/질문/응원 히트맵으로 시각화합니다.",
};

export default function CommentAnalyzerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
