import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ToastContainer } from "@/components/ui/toast-container";
import { ThemeInitializer } from "@/components/providers/ThemeInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://vling.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "블링 - 유튜브 마케팅 플랫폼",
    template: "%s | 블링",
  },
  description:
    "채널 분석, 수익 계산, AI 파인더까지 — 유튜브 마케팅의 모든 것을 블링에서",
  keywords: [
    "유튜브 마케팅",
    "유튜버 분석",
    "채널 분석",
    "인플루언서 마케팅",
    "유튜브 광고",
    "AI 유튜버 추천",
    "유튜브 수익 계산",
    "블링",
  ],
  openGraph: {
    title: "블링 - 유튜브 마케팅 플랫폼",
    description:
      "채널 분석, 수익 계산, AI 파인더까지 — 유튜브 마케팅의 모든 것을 블링에서",
    siteName: "블링 - 유튜브 마케팅 플랫폼",
    type: "website",
    locale: "ko_KR",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "블링 - 유튜브 마케팅 플랫폼",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "블링 - 유튜브 마케팅 플랫폼",
    description:
      "채널 분석, 수익 계산, AI 파인더까지 — 유튜브 마케팅의 모든 것을 블링에서",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <QueryProvider>
            <TooltipProvider>
              <ThemeInitializer />
              {children}
              <ToastContainer />
            </TooltipProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
