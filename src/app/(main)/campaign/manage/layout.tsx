import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "캠페인 관리",
}

export default function CampaignManageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
