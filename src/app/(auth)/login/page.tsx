import type { Metadata } from "next"
import { LoginForm } from "@/components/auth/LoginForm"

export const metadata: Metadata = {
  title: "로그인",
  description: "블링에 로그인하고 유튜브 채널 분석 및 마케팅 도구를 이용하세요.",
  openGraph: {
    title: "로그인 - 블링",
    description: "블링에 로그인하고 유튜브 채널 분석 및 마케팅 도구를 이용하세요.",
  },
}

export default function LoginPage() {
  return <LoginForm />
}
