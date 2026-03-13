import NextAuth, { type DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import type { UserRole, PlanTier } from "@/types/channel"

// ---------------------------------------------------------------------------
// In-memory user store (demo only – resets on server restart)
// ---------------------------------------------------------------------------

interface StoredUser {
  id: string
  email: string
  name: string
  passwordHash: string // plain-text for demo; use bcrypt in production
  role: UserRole
  plan: PlanTier
  createdAt: string
}

// Seed one demo account so the app works out of the box
const userStore = new Map<string, StoredUser>([
  [
    "demo@vling.com",
    {
      id: "user_demo_001",
      email: "demo@vling.com",
      name: "데모 사용자",
      passwordHash: "password123",
      role: "advertiser",
      plan: "basic",
      createdAt: new Date().toISOString(),
    },
  ],
])

export { userStore }

// ---------------------------------------------------------------------------
// Module-augmentation: extend Session / JWT with custom fields
// ---------------------------------------------------------------------------

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      plan: PlanTier
    } & DefaultSession["user"]
  }

  interface User {
    role: UserRole
    plan: PlanTier
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string
    role: UserRole
    plan: PlanTier
  }
}

// ---------------------------------------------------------------------------
// NextAuth config
// ---------------------------------------------------------------------------

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) return null

        const stored = userStore.get(email.toLowerCase())
        if (!stored) return null
        if (stored.passwordHash !== password) return null

        return {
          id: stored.id,
          email: stored.email,
          name: stored.name,
          role: stored.role,
          plan: stored.plan,
        }
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // user.id is typed as string | undefined in next-auth v5 beta
        token.id = (user.id ?? "") as string
        token.role = (user as { role: UserRole }).role
        token.plan = (user as { plan: PlanTier }).plan
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.plan = token.plan
      }
      return session
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
})
