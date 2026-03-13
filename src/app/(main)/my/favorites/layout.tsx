import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "즐겨찾기 관리",
  description: "즐겨찾기한 유튜브 채널을 관리하세요.",
};

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
