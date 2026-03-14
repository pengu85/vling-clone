import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "수익 역산기 - 목표 수익 달성에 필요한 조건 계산",
  description:
    "월 목표 수익을 입력하면 필요한 구독자 수, 조회수, 업로드 빈도를 역산합니다. 광고, 슈퍼챗, 멤버십, 협찬 등 다양한 수익 시나리오를 비교하세요.",
};

export default function RevenueReverseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
