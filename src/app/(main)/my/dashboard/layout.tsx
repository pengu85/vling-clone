import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 대시보드",
  description: "내 채널과 캠페인 현황을 한눈에 확인하세요.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
