import type { Metadata } from "next"
import { SignupForm } from "@/components/auth/SignupForm"

export const metadata: Metadata = {
  title: "회원가입",
  description: "블링에 가입하고 유튜브 데이터 분석과 AI 기반 마케팅 도구를 무료로 체험하세요.",
  openGraph: {
    title: "회원가입 - 블링",
    description: "블링에 가입하고 유튜브 데이터 분석과 AI 기반 마케팅 도구를 무료로 체험하세요.",
  },
}

export default function SignupPage() {
  return <SignupForm />
}
