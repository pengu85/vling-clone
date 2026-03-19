import Link from "next/link"
import { Separator } from "@/components/ui/separator"

const deadLinks = new Set(["/about", "/blog", "/faq", "/support", "/contact"])

const footerColumns = [
  {
    title: "기능",
    links: [
      { label: "채널 검색", href: "/search" },
      { label: "알고리즘 검색", href: "/algorithm-score" },
      { label: "유튜브 순위", href: "/ranking" },
      { label: "영상 순위", href: "/ranking/videos" },
      { label: "유튜버 모니터", href: "/tools/youtuber-tracker" },
    ],
  },
  {
    title: "도구",
    links: [
      { label: "AI 파인더", href: "/tools/ai-finder" },
      { label: "수익 계산기", href: "/tools/calculator" },
      { label: "채널 비교", href: "/tools/compare" },
      { label: "AI 콘텐츠", href: "/tools/ai-content" },
      { label: "썸네일 분석", href: "/tools/thumbnail-analyzer" },
    ],
  },
  {
    title: "회사",
    links: [
      { label: "서비스 소개", href: "/about" },
      { label: "요금 안내", href: "/pricing" },
      { label: "엔터프라이즈", href: "/enterprise" },
      { label: "블로그", href: "/blog" },
    ],
  },
  {
    title: "지원",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "고객 문의", href: "/support" },
      { label: "비즈니스 문의", href: "/contact" },
      { label: "이용약관", href: "/terms" },
      { label: "개인정보처리방침", href: "/privacy" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* 4컬럼 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-slate-200 mb-4">{col.title}</h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => {
                  const isDead = deadLinks.has(link.href)
                  return (
                    <li key={link.href}>
                      {isDead ? (
                        <span
                          className="text-sm text-slate-600 cursor-not-allowed"
                          title="준비 중"
                        >
                          {link.label}
                        </span>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="bg-slate-800 mb-8" />

        {/* 하단 저작권 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-lg font-bold text-slate-200">블링</span>
          <p className="text-sm text-slate-500">
            &copy; 2026 블링. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
