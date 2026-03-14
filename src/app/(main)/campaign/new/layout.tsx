import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "캠페인 만들기",
}

export default function CampaignNewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
