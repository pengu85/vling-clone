import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "알림",
  description: "채널 변동 및 캠페인 관련 알림을 확인하세요.",
};

export default function AlertsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
