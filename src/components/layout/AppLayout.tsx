"use client"

import { useState, useEffect } from "react"
import { Header } from "./Header"
import { Sidebar } from "./Sidebar"
import { Footer } from "./Footer"
import { cn } from "@/lib/utils"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Restore sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved === "true") setSidebarCollapsed(true)
  }, [])

  function handleCollapsedChange(collapsed: boolean) {
    setSidebarCollapsed(collapsed)
    localStorage.setItem("sidebar-collapsed", String(collapsed))
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header />
      <div className="flex flex-1 pt-14">
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={handleCollapsedChange}
        />
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
