"use client"

import { useState } from "react"
import { Header } from "./Header"
import { Sidebar } from "./Sidebar"
import { Footer } from "./Footer"
import { cn } from "@/lib/utils"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* 상단 헤더 (고정) */}
      <Header />

      {/* 본문 영역 */}
      <div className="flex flex-1 pt-14">
        {/* 데스크탑 사이드바 */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />

        {/* 메인 콘텐츠 — 사이드바 너비만큼 왼쪽 여백 */}
        <div
          className={cn(
            "flex-1 flex flex-col min-w-0 transition-all duration-200",
            "md:ml-60",
            sidebarCollapsed && "md:ml-14"
          )}
        >
          <main className="flex-1 p-6">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  )
}
