"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Header } from "./Header"
import { Sidebar, SidebarContent } from "./Sidebar"
import { Footer } from "./Footer"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
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

        {/* 모바일 사이드바 Sheet */}
        <div className="md:hidden fixed bottom-4 left-4 z-50">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger
              className="inline-flex items-center justify-center size-12 rounded-full shadow-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors"
              aria-label="메뉴 열기"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="bg-slate-900 border-slate-800 p-0 flex flex-col w-64"
            >
              <SheetHeader className="p-4 pb-2">
                <SheetTitle className="text-left">
                  <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                    블링
                  </span>
                </SheetTitle>
              </SheetHeader>
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>

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
