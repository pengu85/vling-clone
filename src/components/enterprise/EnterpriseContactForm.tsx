"use client"

import { useState } from "react"
import { Send, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function EnterpriseContactForm() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // UI only — no backend
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-700 bg-slate-800/50 p-12 text-center">
        <CheckCircle className="h-12 w-12 text-emerald-400" />
        <h3 className="text-xl font-semibold text-white">문의가 접수되었습니다</h3>
        <p className="text-slate-400">
          영업일 기준 1일 이내에 담당자가 이메일로 연락드리겠습니다.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-700 bg-slate-800/50 p-8 space-y-5"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* 이름 */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium text-slate-300">
            이름 <span className="text-violet-400">*</span>
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="홍길동"
            required
            className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500 focus-visible:border-violet-500"
          />
        </div>

        {/* 이메일 */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-slate-300">
            이메일 <span className="text-violet-400">*</span>
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="hong@company.com"
            required
            className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500 focus-visible:border-violet-500"
          />
        </div>
      </div>

      {/* 회사명 */}
      <div className="space-y-1.5">
        <label htmlFor="company" className="text-sm font-medium text-slate-300">
          회사명 <span className="text-violet-400">*</span>
        </label>
        <Input
          id="company"
          name="company"
          type="text"
          placeholder="(주)블링미디어"
          required
          className="border-slate-600 bg-slate-900 text-white placeholder:text-slate-500 focus-visible:border-violet-500"
        />
      </div>

      {/* 메시지 */}
      <div className="space-y-1.5">
        <label htmlFor="message" className="text-sm font-medium text-slate-300">
          문의 내용
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder="팀 규모, 필요한 기능, 예산 등을 자유롭게 작성해주세요."
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus-visible:border-violet-500 focus-visible:ring-3 focus-visible:ring-violet-500/30 disabled:opacity-50 resize-none"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-violet-600 hover:bg-violet-500 text-white border-none gap-2 h-10"
      >
        <Send className="h-4 w-4" />
        문의 보내기
      </Button>

      <p className="text-center text-xs text-slate-500">
        제출하면 블링의{" "}
        <a href="#" className="underline hover:text-slate-300 transition-colors">
          개인정보처리방침
        </a>
        에 동의하는 것으로 간주됩니다.
      </p>
    </form>
  )
}
