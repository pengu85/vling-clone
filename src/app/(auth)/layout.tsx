import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "블링 - 로그인",
  description: "블링 인플루언서 마케팅 플랫폼",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* 로고 */}
      <Link href="/" className="relative mb-8 flex items-center gap-2 group">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-105">
          <span className="text-white font-bold text-lg">B</span>
        </div>
        <span className="text-2xl font-bold text-white tracking-tight">블링</span>
      </Link>

      {/* 카드 영역 */}
      <div className="relative w-full max-w-[400px]">
        {children}
      </div>

      {/* 하단 저작권 */}
      <p className="relative mt-8 text-xs text-slate-500">
        © 2026 블링. All rights reserved.
      </p>
    </div>
  )
}
