"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Mail, Lock } from "lucide-react"
import { z } from "zod"
import { signIn } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useToast } from "@/stores/toastStore"

const loginSchema = z.object({
  email: z.string().min(1, "이메일을 입력해주세요").email("유효한 이메일 형식이 아닙니다"),
  password: z.string().min(1, "비밀번호를 입력해주세요").min(6, "비밀번호는 6자 이상이어야 합니다"),
})

type LoginFormData = z.infer<typeof loginSchema>
type FieldErrors = Partial<Record<keyof LoginFormData, string>>

const GOOGLE_AUTH_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true"

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawCallbackUrl = searchParams.get("callbackUrl") ?? "/"
  // Prevent open redirect: only allow relative paths
  const callbackUrl = rawCallbackUrl.startsWith("/") ? rawCallbackUrl : "/"
  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof LoginFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
    if (serverError) setServerError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const result = loginSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: FieldErrors = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginFormData
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)
    setServerError(null)

    try {
      const res = await signIn("credentials", {
        email: result.data.email,
        password: result.data.password,
        redirect: false,
      })

      if (res?.error) {
        setServerError("이메일 또는 비밀번호가 올바르지 않습니다")
      } else {
        toast("로그인 성공!", "success")
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setServerError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10 text-white shadow-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-white">블링에 로그인</CardTitle>
        <CardDescription className="text-slate-400">
          계정 정보를 입력해 시작하세요
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Google 소셜 로그인 */}
        {GOOGLE_AUTH_ENABLED && (
          <>
            <Button
              type="button"
              onClick={() => signIn("google", { callbackUrl })}
              className="w-full h-11 bg-white hover:bg-slate-100 text-slate-900 font-medium gap-3 border border-slate-200 shadow-sm transition-all"
            >
              <GoogleIcon className="size-5" />
              Google로 계속하기
            </Button>

            {/* 구분선 */}
            <div className="relative flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-slate-700" />
              <span className="text-xs text-slate-500">또는</span>
              <div className="h-px flex-1 bg-slate-700" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* 서버 에러 */}
          {serverError && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2">
              <p className="text-sm text-red-400">{serverError}</p>
            </div>
          )}

          {/* 이메일 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300" htmlFor="email">
              이메일
            </label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleChange}
                className={cn(
                  "h-10 pl-9 bg-white/10 border-white/15 text-white placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-blue-400/30",
                  errors.email && "border-red-400 focus-visible:border-red-400"
                )}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email}</p>
            )}
          </div>

          {/* 비밀번호 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300" htmlFor="password">
                비밀번호
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                비밀번호 찾기
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="비밀번호를 입력하세요"
                value={formData.password}
                onChange={handleChange}
                className={cn(
                  "h-10 pl-9 bg-white/10 border-white/15 text-white placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-blue-400/30",
                  errors.password && "border-red-400 focus-visible:border-red-400"
                )}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-400">{errors.password}</p>
            )}
          </div>

          {/* 로그인 버튼 */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 bg-blue-500 hover:bg-blue-400 text-white font-medium border-transparent shadow-lg shadow-blue-500/20 transition-all"
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </Button>
        </form>

        {/* Kakao 로그인 (향후 구현) */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-10 bg-yellow-400/10 border-yellow-400/30 text-yellow-300 hover:bg-yellow-400/20 hover:text-yellow-200 gap-2"
          onClick={() => console.log("Kakao 로그인 (미구현)")}
        >
          <span className="text-base leading-none font-bold">K</span>
          Kakao로 계속하기
        </Button>
      </CardContent>

      <CardFooter className="justify-center border-t border-white/10 bg-white/5">
        <p className="text-sm text-slate-400">
          계정이 없으신가요?{" "}
          <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            회원가입
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
