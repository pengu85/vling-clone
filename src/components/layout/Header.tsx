"use client"

import Link from "next/link"
import { useState, useRef, useEffect, useCallback } from "react"
import { Search, Menu, LogOut, User, Moon, Sun } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useThemeStore } from "@/stores/themeStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useAutocomplete } from "@/hooks/useAutocomplete"
import { AutocompleteDropdown } from "@/components/search/AutocompleteDropdown"
import type { AutocompleteChannel } from "@/app/api/youtube/autocomplete/route"
import { SidebarContent } from "@/components/layout/Sidebar"

const navLinks = [
  { label: "채널 검색", href: "/search" },
  { label: "랭킹", href: "/ranking" },
  { label: "트렌딩", href: "/trending" },
  { label: "요금제", href: "/pricing" },
]

function UserMenu() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div className="h-8 w-24 animate-pulse rounded-md bg-slate-800" />
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {/* Avatar + name */}
        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-slate-800 text-slate-200 text-sm">
          <div className="size-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0">
            <User className="size-3.5 text-white" />
          </div>
          <span className="max-w-[120px] truncate">{session.user.name ?? session.user.email}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-white hover:bg-slate-800 gap-1.5"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="size-3.5" />
          로그아웃
        </Button>
      </div>
    )
  }

  return (
    <>
      <Link
        href="/login"
        className="inline-flex items-center justify-center rounded-lg border border-transparent px-2.5 h-7 text-[0.8rem] font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
      >
        로그인
      </Link>
      <Link
        href="/signup"
        className="inline-flex items-center justify-center rounded-lg h-7 px-2.5 text-[0.8rem] font-medium bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white transition-colors"
      >
        무료 시작
      </Link>
    </>
  )
}

function MobileUserMenu() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div className="h-9 w-full animate-pulse rounded-md bg-slate-800" />
  }

  if (session?.user) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-800 text-slate-200 text-sm">
          <div className="size-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0">
            <User className="size-4 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium truncate">{session.user.name}</span>
            <span className="text-xs text-slate-400 truncate">{session.user.email}</span>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 w-full gap-2"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="size-4" />
          로그아웃
        </Button>
      </div>
    )
  }

  return (
    <>
      <Link
        href="/login"
        className="inline-flex items-center justify-center rounded-lg border border-slate-700 w-full py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
      >
        로그인
      </Link>
      <Link
        href="/signup"
        className="inline-flex items-center justify-center rounded-lg w-full py-2 text-sm font-medium bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white transition-colors"
      >
        무료 시작
      </Link>
    </>
  )
}

export function Header() {
  const [searchValue, setSearchValue] = useState("")
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const router = useRouter()
  const { theme, toggleTheme } = useThemeStore()

  // Refs for click-outside detection on desktop and mobile search wrappers
  const desktopSearchRef = useRef<HTMLDivElement>(null)
  const mobileSearchRef = useRef<HTMLDivElement>(null)

  const {
    suggestions,
    isLoading: autocompleteLoading,
    isOpen,
    activeIndex,
    setIsOpen,
    setActiveIndex,
    clearSuggestions,
  } = useAutocomplete(searchValue)

  // Click-outside handler: close dropdown when clicking outside both search wrappers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const outsideDesktop =
        !desktopSearchRef.current || !desktopSearchRef.current.contains(target)
      const outsideMobile =
        !mobileSearchRef.current || !mobileSearchRef.current.contains(target)
      if (outsideDesktop && outsideMobile) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [setIsOpen])

  function handleHeaderSearch() {
    const q = searchValue.trim()
    if (q) {
      clearSuggestions()
      router.push(`/search?q=${encodeURIComponent(q)}`)
      setSearchValue("")
      setMobileSearchOpen(false)
    }
  }

  const handleSelectChannel = useCallback(
    (channel: AutocompleteChannel) => {
      clearSuggestions()
      setSearchValue("")
      router.push(`/channel/${channel.channelId}`)
    },
    [clearSuggestions, router]
  )

  // Show dropdown when loading or when results are available
  const showDropdown = (isOpen || autocompleteLoading) && searchValue.trim() !== ""

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex(Math.min(activeIndex + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex(Math.max(activeIndex - 1, -1))
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault()
      handleSelectChannel(suggestions[activeIndex])
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* 로고 */}
        <Link href="/" className="flex-shrink-0">
          <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            블링
          </span>
        </Link>

        {/* 검색바 (데스크탑) */}
        <div ref={desktopSearchRef} className="hidden md:flex flex-1 max-w-md relative mx-4">
          <form
            onSubmit={(e) => { e.preventDefault(); handleHeaderSearch() }}
            className="w-full relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none z-10" />
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (suggestions.length > 0) setIsOpen(true) }}
              placeholder="채널명, 키워드로 검색..."
              className="pl-9 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:border-violet-500 focus-visible:ring-violet-500/20 h-8 text-sm"
              autoComplete="off"
              aria-expanded={isOpen}
              aria-haspopup="listbox"
            />
          </form>
          {showDropdown && (
            <AutocompleteDropdown
              suggestions={suggestions}
              activeIndex={activeIndex}
              onSelect={handleSelectChannel}
              onMouseEnter={setActiveIndex}
              isLoading={autocompleteLoading}
              query={searchValue}
            />
          )}
        </div>

        {/* 네비게이션 (데스크탑) */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        {/* 오른쪽 버튼 (데스크탑) */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="inline-flex items-center justify-center rounded-md h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="테마 변경"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <UserMenu />
        </div>

        {/* 모바일 검색 아이콘 */}
        <button
          className="md:hidden ml-auto inline-flex items-center justify-center rounded-lg p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="검색"
          onClick={() => setMobileSearchOpen((v) => !v)}
        >
          <Search className="size-5" />
        </button>

        {/* 모바일 햄버거 */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger
              className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="메뉴 열기"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-slate-900 border-slate-800 w-72 flex flex-col gap-0 p-0 overflow-hidden"
            >
              <SheetHeader className="p-4 pb-2 flex-shrink-0">
                <SheetTitle className="text-left">
                  <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                    블링
                  </span>
                </SheetTitle>
              </SheetHeader>

              {/* 모바일 검색 */}
              <div ref={mobileSearchRef} className="px-4 pb-3 relative flex-shrink-0">
                <form onSubmit={(e) => { e.preventDefault(); handleHeaderSearch() }}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none z-10" />
                    <Input
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => { if (suggestions.length > 0) setIsOpen(true) }}
                      placeholder="채널명, 키워드로 검색..."
                      className="pl-9 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 h-9 text-sm"
                      autoComplete="off"
                      aria-expanded={isOpen}
                      aria-haspopup="listbox"
                    />
                  </div>
                </form>
                {showDropdown && (
                  <AutocompleteDropdown
                    suggestions={suggestions}
                    activeIndex={activeIndex}
                    onSelect={handleSelectChannel}
                    onMouseEnter={setActiveIndex}
                    isLoading={autocompleteLoading}
                    query={searchValue}
                  />
                )}
              </div>

              {/* 모바일 전체 네비게이션 */}
              <div className="flex-1 min-h-0">
                <SidebarContent />
              </div>

              <div className="px-4 pt-2 pb-4 flex-shrink-0 border-t border-slate-800 flex flex-col gap-2">
                <MobileUserMenu />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* 모바일 검색 오버레이 */}
      {mobileSearchOpen && (
        <div ref={mobileSearchRef} className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-2 relative">
          <form onSubmit={(e) => { e.preventDefault(); handleHeaderSearch() }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none z-10" />
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (suggestions.length > 0) setIsOpen(true) }}
                placeholder="채널명, 키워드로 검색..."
                className="pl-9 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:border-violet-500 focus-visible:ring-violet-500/20 h-9 text-sm"
                autoComplete="off"
                autoFocus
                aria-expanded={isOpen}
                aria-haspopup="listbox"
              />
            </div>
          </form>
          {showDropdown && (
            <AutocompleteDropdown
              suggestions={suggestions}
              activeIndex={activeIndex}
              onSelect={handleSelectChannel}
              onMouseEnter={setActiveIndex}
              isLoading={autocompleteLoading}
              query={searchValue}
            />
          )}
        </div>
      )}
    </header>
  )
}
