import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "바이럴 예측",
  description:
    "YouTube 영상의 초기 성과를 분석하여 바이럴 가능성을 예측합니다. 조회수 증가율, 참여도, 댓글 속도를 기반으로 실시간 예측 제공.",
};

export default function ViralPredictorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
