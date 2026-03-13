import Link from "next/link"
import { Separator } from "@/components/ui/separator"

const footerColumns = [
  {
    title: "기능",
    links: [
      { label: "채널 검색", href: "/search" },
      { label: "유튜브 순위", href: "/ranking" },
      { label: "수익 계산기", href: "/tools/calculator" },
      { label: "AI 파인더", href: "/tools/ai-finder" },
      { label: "채널 비교", href: "/tools/compare" },
    ],
  },
  {
    title: "기타",
    links: [
      { label: "요금안내", href: "/pricing" },
      { label: "블로그", href: "/blog" },
      { label: "업데이트 노트", href: "/changelog" },
      { label: "로드맵", href: "/roadmap" },
    ],
  },
  {
    title: "문의",
    links: [
      { label: "고객센터", href: "/support" },
      { label: "비즈니스 문의", href: "/contact" },
      { label: "파트너십", href: "/partnership" },
      { label: "광고 문의", href: "/advertise" },
    ],
  },
  {
    title: "회사정보",
    links: [
      { label: "회사소개", href: "/about" },
      { label: "채용", href: "/careers" },
      { label: "개인정보처리방침", href: "/privacy" },
      { label: "이용약관", href: "/terms" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* 4컬럼 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-slate-200 mb-4">{col.title}</h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="bg-slate-800 mb-8" />

        {/* 하단 저작권 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            블링
          </span>
          <p className="text-sm text-slate-600">
            &copy; {new Date().getFullYear()} 블링. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
