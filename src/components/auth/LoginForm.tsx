"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Mail, Lock, Chrome } from "lucide-react"
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

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/"
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

        {/* 구분선 */}
        <div className="relative flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-slate-500">또는</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* 소셜 로그인 */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 bg-white/5 border-white/15 text-slate-300 hover:bg-white/10 hover:text-white gap-2"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            <Chrome className="size-4" />
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 bg-yellow-400/10 border-yellow-400/30 text-yellow-300 hover:bg-yellow-400/20 hover:text-yellow-200 gap-2"
            onClick={() => console.log("Kakao 로그인 (미구현)")}
          >
            <span className="text-base leading-none">K</span>
            Kakao
          </Button>
        </div>
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
