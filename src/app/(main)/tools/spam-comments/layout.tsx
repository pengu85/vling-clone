import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "스팸 댓글 관리",
  description:
    "유튜브 채널의 스팸 댓글을 자동으로 탐지하고 분류하여 관리할 수 있습니다. 홍보성, 피싱, 반복, 욕설, 봇 댓글을 식별합니다.",
  openGraph: {
    title: "스팸 댓글 관리 - 블링",
    description:
      "유튜브 채널의 스팸 댓글을 자동으로 탐지하고 분류하여 관리할 수 있습니다.",
  },
};

export default function SpamCommentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
