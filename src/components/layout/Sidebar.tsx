"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Search,
  Video,
  BarChart2,
  DollarSign,
  Gift,
  TrendingUp,
  Sparkles,
  Calculator,
  GitCompare,
  FileText,
  Activity,
  Star,
  Bell,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

interface MenuItem {
  label: string
  href: string
  icon: React.ElementType
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

const menuSections: MenuSection[] = [
  {
    title: "검색",
    items: [
      { label: "채널 검색", href: "/search", icon: Search },
      { label: "알고리즘 점수 검색", href: "/algorithm-score", icon: Video },
    ],
  },
  {
    title: "순위",
    items: [
      { label: "유튜브 순위", href: "/ranking", icon: BarChart2 },
      { label: "수익 순위", href: "/ranking/revenue", icon: DollarSign },
      { label: "슈퍼챗 순위", href: "/ranking/superchat", icon: Gift },
      { label: "요즘 뜨는", href: "/ranking/growth", icon: TrendingUp },
      { label: "카테고리 트렌드", href: "/ranking/categories", icon: BarChart2 },
    ],
  },
  {
    title: "도구",
    items: [
      { label: "AI 파인더", href: "/tools/ai-finder", icon: Sparkles },
      { label: "수익 계산기", href: "/tools/calculator", icon: Calculator },
      { label: "채널 비교", href: "/tools/compare", icon: GitCompare },
      { label: "AI 콘텐츠", href: "/tools/ai-content", icon: FileText },
      { label: "유튜버 모니터", href: "/tools/youtuber-tracker", icon: Activity },
    ],
  },
  {
    title: "즐겨찾기",
    items: [
      { label: "대시보드", href: "/my/dashboard", icon: LayoutDashboard },
      { label: "즐겨찾기 관리", href: "/my/favorites", icon: Star },
      { label: "알림", href: "/my/alerts", icon: Bell },
      { label: "내 채널 리포트", href: "/my/channel-report", icon: FileText },
    ],
  },
]

interface SidebarNavItemProps {
  item: MenuItem
  isActive: boolean
  collapsed: boolean
}

function SidebarNavItem({ item, isActive, collapsed }: SidebarNavItemProps) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
        isActive
          ? "bg-blue-600/20 text-blue-400 font-medium"
          : "text-slate-400 hover:text-slate-100 hover:bg-slate-800",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0",
          isActive ? "text-blue-400" : "text-slate-500"
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )
}

interface SidebarProps {
  className?: string
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function Sidebar({
  className,
  collapsed = false,
  onCollapsedChange,
}: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col fixed left-0 top-14 bottom-0 z-40",
        "bg-slate-900 border-r border-slate-800 transition-all duration-200",
        collapsed ? "w-14" : "w-60",
        className
      )}
    >
      <ScrollArea className="flex-1 py-3">
        <div className="flex flex-col gap-1">
          {menuSections.map((section, sectionIdx) => (
            <div key={section.title}>
              {sectionIdx > 0 && (
                <Separator className="my-2 bg-slate-800" />
              )}
              {!collapsed && (
                <p className="px-3 pb-1 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {section.title}
                </p>
              )}
              <div className="flex flex-col gap-0.5 px-2">
                {section.items.map((item) => (
                  <SidebarNavItem
                    key={item.href}
                    item={item}
                    isActive={pathname === item.href}
                    collapsed={collapsed}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* 접기/펼치기 토글 */}
      <div className="p-2 border-t border-slate-800">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onCollapsedChange?.(!collapsed)}
          className={cn(
            "w-full text-slate-500 hover:text-slate-300 hover:bg-slate-800",
            collapsed ? "justify-center" : "justify-end"
          )}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
          <span className="sr-only">
            {collapsed ? "사이드바 펼치기" : "사이드바 접기"}
          </span>
        </Button>
      </div>
    </aside>
  )
}

// 모바일 Sheet 안에 렌더링할 콘텐츠
export function SidebarContent() {
  const pathname = usePathname()

  return (
    <ScrollArea className="flex-1 py-3">
      <div className="flex flex-col gap-1">
        {menuSections.map((section, sectionIdx) => (
          <div key={section.title}>
            {sectionIdx > 0 && <Separator className="my-2 bg-slate-800" />}
            <p className="px-3 pb-1 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
              {section.title}
            </p>
            <div className="flex flex-col gap-0.5 px-2">
              {section.items.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href}
                  collapsed={false}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
