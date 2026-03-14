import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "수익 시뮬레이터 - 유튜브 미래 수익 예측",
  description:
    "업로드 빈도, 카테고리, 구독자 성장률을 조절하여 유튜브 채널의 미래 수익을 시뮬레이션하세요. 광고, 슈퍼챗, 멤버십, 협찬 수익을 포함한 종합 예측.",
};

export default function RevenueSimulatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
