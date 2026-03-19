"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, Lock, User, Building2, Eye, EyeOff } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const USER_TYPES = [
  { value: "advertiser", label: "광고주" },
  { value: "mcn", label: "MCN" },
  { value: "youtuber", label: "유튜버" },
  { value: "agency", label: "광고대행사" },
] as const

type UserType = (typeof USER_TYPES)[number]["value"]

const signupSchema = z
  .object({
    name: z.string().min(1, "이름을 입력해주세요").min(2, "이름은 2자 이상이어야 합니다"),
    email: z.string().min(1, "이메일을 입력해주세요").email("유효한 이메일 형식이 아닙니다"),
    password: z
      .string()
      .min(1, "비밀번호를 입력해주세요")
      .min(8, "비밀번호는 8자 이상이어야 합니다"),
    confirmPassword: z.string().min(1, "비밀번호를 다시 입력해주세요"),
    userType: z.enum(["advertiser", "mcn", "youtuber", "agency"], {
      error: "사용자 유형을 선택해주세요",
    }),
    agreeTerms: z.boolean().refine((v) => v === true, "이용약관에 동의해주세요"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  })

type SignupFormData = z.infer<typeof signupSchema>
type FieldErrors = Partial<Record<keyof SignupFormData, string>>

function getPasswordStrength(password: string): { level: "weak" | "medium" | "strong"; label: string } {
  if (password.length === 0) return { level: "weak", label: "" }
  if (password.length < 8) return { level: "weak", label: "약함" }
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  if (hasUpper && hasNumber && hasSpecial) return { level: "strong", label: "강함" }
  return { level: "medium", label: "보통" }
}

export function SignupForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<Omit<SignupFormData, "userType"> & { userType: string }>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "",
    agreeTerms: false,
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
    if (errors[name as keyof FieldErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
    if (serverError) setServerError(null)
  }

  function handleConfirmPasswordBlur() {
    if (formData.confirmPassword && formData.confirmPassword !== formData.password) {
      setErrors((prev) => ({ ...prev, confirmPassword: "비밀번호가 일치하지 않습니다" }))
    }
  }

  function handleUserTypeChange(value: string | null) {
    setFormData((prev) => ({ ...prev, userType: value ?? "" }))
    if (errors.userType) {
      setErrors((prev) => ({ ...prev, userType: undefined }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const result = signupSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: FieldErrors = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FieldErrors
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)
    setServerError(null)

    try {
      // 1. Register the user
      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.data.name,
          email: result.data.email,
          password: result.data.password,
          userType: result.data.userType,
        }),
      })

      const signupData = await signupRes.json()

      if (!signupRes.ok) {
        setServerError(signupData.error ?? "회원가입 중 오류가 발생했습니다")
        return
      }

      // 2. Auto-login after successful registration
      const loginRes = await signIn("credentials", {
        email: result.data.email,
        password: result.data.password,
        redirect: false,
      })

      if (loginRes?.error) {
        // Registration succeeded but auto-login failed — redirect to login page
        router.push("/login")
      } else {
        router.push("/")
        router.refresh()
      }
    } catch {
      setServerError("서버 오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setIsLoading(false)
    }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10 text-white shadow-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-white">블링 회원가입</CardTitle>
        <CardDescription className="text-slate-400">
          정보를 입력하고 인플루언서 마케팅을 시작하세요
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* 서버 에러 */}
          {serverError && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2">
              <p className="text-sm text-red-400">{serverError}</p>
            </div>
          )}

          {/* 이름 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300" htmlFor="name">
              이름
            </label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="홍길동"
                value={formData.name}
                onChange={handleChange}
                className={cn(
                  "h-10 pl-9 bg-white/10 border-white/15 text-white placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-blue-400/30",
                  errors.name && "border-red-400 focus-visible:border-red-400"
                )}
              />
            </div>
            {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
          </div>

          {/* 이메일 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300" htmlFor="signup-email">
              이메일
            </label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <Input
                id="signup-email"
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
            {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
          </div>

          {/* 비밀번호 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300" htmlFor="signup-password">
              비밀번호
            </label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <Input
                id="signup-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="8자 이상 입력하세요"
                value={formData.password}
                onChange={handleChange}
                className={cn(
                  "h-10 pl-9 pr-10 bg-white/10 border-white/15 text-white placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-blue-400/30",
                  errors.password && "border-red-400 focus-visible:border-red-400"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {/* Password strength indicator */}
            {formData.password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  <div
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      passwordStrength.level === "weak" ? "bg-red-500" :
                      passwordStrength.level === "medium" ? "bg-yellow-500" :
                      "bg-green-500"
                    )}
                  />
                  <div
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      passwordStrength.level === "medium" ? "bg-yellow-500" :
                      passwordStrength.level === "strong" ? "bg-green-500" :
                      "bg-white/15"
                    )}
                  />
                  <div
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      passwordStrength.level === "strong" ? "bg-green-500" : "bg-white/15"
                    )}
                  />
                </div>
                <p
                  className={cn(
                    "text-xs",
                    passwordStrength.level === "weak" ? "text-red-400" :
                    passwordStrength.level === "medium" ? "text-yellow-400" :
                    "text-green-400"
                  )}
                >
                  {passwordStrength.label}
                </p>
              </div>
            )}
            {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
          </div>

          {/* 비밀번호 확인 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300" htmlFor="confirmPassword">
              비밀번호 확인
            </label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="비밀번호를 다시 입력하세요"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleConfirmPasswordBlur}
                className={cn(
                  "h-10 pl-9 pr-10 bg-white/10 border-white/15 text-white placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-blue-400/30",
                  errors.confirmPassword && "border-red-400 focus-visible:border-red-400"
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={showConfirmPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-400">{errors.confirmPassword}</p>
            )}
          </div>

          {/* 사용자 유형 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">
              <Building2 className="inline size-4 mr-1.5 mb-0.5" />
              사용자 유형
            </label>
            <Select value={formData.userType} onValueChange={handleUserTypeChange}>
              <SelectTrigger
                className={cn(
                  "w-full h-10 bg-white/10 border-white/15 text-white data-placeholder:text-slate-500 focus-visible:border-blue-400 focus-visible:ring-blue-400/30",
                  errors.userType && "border-red-400"
                )}
              >
                <SelectValue placeholder="유형을 선택하세요" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/15 text-white">
                {USER_TYPES.map((type) => (
                  <SelectItem
                    key={type.value}
                    value={type.value}
                    className="focus:bg-white/10 focus:text-white"
                  >
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.userType && <p className="text-xs text-red-400">{errors.userType}</p>}
          </div>

          {/* 이용약관 */}
          <div className="space-y-1.5">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="mt-0.5 size-4 rounded border-white/20 bg-white/10 accent-blue-500 cursor-pointer"
              />
              <span className="text-sm text-slate-300 leading-snug">
                <Link href="/terms" className="text-blue-400 hover:text-blue-300 transition-colors">
                  이용약관
                </Link>{" "}
                및{" "}
                <Link
                  href="/privacy"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  개인정보처리방침
                </Link>
                에 동의합니다
              </span>
            </label>
            {errors.agreeTerms && (
              <p className="text-xs text-red-400 pl-6.5">{errors.agreeTerms}</p>
            )}
          </div>

          {/* 회원가입 버튼 */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 bg-blue-500 hover:bg-blue-400 text-white font-medium border-transparent shadow-lg shadow-blue-500/20 transition-all"
          >
            {isLoading ? "처리 중..." : "회원가입"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t border-white/10 bg-white/5">
        <p className="text-sm text-slate-400">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            로그인
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
