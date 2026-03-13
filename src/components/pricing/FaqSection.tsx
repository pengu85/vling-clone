"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const FAQ_ITEMS = [
  {
    question: "무료 플랜에서 유료 플랜으로 언제든지 업그레이드할 수 있나요?",
    answer:
      "네, 언제든지 가능합니다. 업그레이드하면 즉시 상위 플랜의 기능을 사용할 수 있으며, 남은 기간에 대한 요금은 일할 계산되어 처리됩니다.",
  },
  {
    question: "연간 결제 시 환불 정책은 어떻게 되나요?",
    answer:
      "연간 결제 후 30일 이내에 환불을 요청하시면 전액 환불해드립니다. 30일 이후에는 남은 기간에 대해 일할 계산하여 환불됩니다.",
  },
  {
    question: "팀원과 계정을 공유할 수 있나요?",
    answer:
      "현재는 1인 1계정 정책을 운영하고 있습니다. 팀 기능은 곧 출시될 예정입니다. 여러 계정이 필요한 경우 엔터프라이즈 플랜을 통해 팀 관리 기능을 제공해드릴 수 있습니다.",
  },
  {
    question: "결제 수단으로 어떤 방법을 지원하나요?",
    answer:
      "신용카드(Visa, MasterCard, 국내 카드), 체크카드, 계좌이체를 지원합니다. 엔터프라이즈 플랜의 경우 세금계산서 발행 및 기업 후불 결제도 가능합니다.",
  },
  {
    question: "데이터는 얼마나 자주 업데이트되나요?",
    answer:
      "채널 기본 데이터는 24시간마다, 영상 데이터는 6시간마다 업데이트됩니다. 인기 채널의 경우 더 빈번하게 업데이트될 수 있으며, 엔터프라이즈 플랜은 실시간 데이터 접근이 가능합니다.",
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = openIndex === index
        return (
          <div
            key={index}
            className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-medium text-white">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                isOpen ? "max-h-60" : "max-h-0"
              )}
            >
              <p className="px-5 pb-4 text-sm leading-relaxed text-slate-400">
                {item.answer}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
