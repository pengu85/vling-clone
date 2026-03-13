import { NextResponse } from "next/server"
import { z } from "zod"
import { userStore } from "@/auth"
import type { UserRole, PlanTier } from "@/types/channel"

const signupBody = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  userType: z.enum(["advertiser", "mcn", "youtuber", "agency"]),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = signupBody.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, email, password, userType } = parsed.data
    const normalizedEmail = email.toLowerCase()

    if (userStore.has(normalizedEmail)) {
      return NextResponse.json(
        { error: "이미 사용 중인 이메일입니다" },
        { status: 409 }
      )
    }

    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      email: normalizedEmail,
      name,
      passwordHash: password, // plain-text for demo; use bcrypt in production
      role: userType as UserRole,
      plan: "basic" as PlanTier,
      createdAt: new Date().toISOString(),
    }

    userStore.set(normalizedEmail, newUser)

    // Return user without passwordHash
    const { passwordHash: _, ...safeUser } = newUser
    return NextResponse.json({ user: safeUser }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}
