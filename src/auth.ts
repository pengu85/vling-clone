import NextAuth, { type DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import type { UserRole, PlanTier } from "@/types/channel"

interface StoredUser {
  id: string
  email: string
  name: string
  passwordHash: string
  role: UserRole
  plan: PlanTier
  createdAt: string
}

// Pre-hashed password for demo account ("password123")
const DEMO_PASSWORD_HASH = bcrypt.hashSync("password123", 10)

// NOTE: In-memory store for demo/development only.
// For production, replace with database (e.g., Prisma + PostgreSQL).
const userStore = new Map<string, StoredUser>([
  [
    "demo@vling.com",
    {
      id: "user_demo_001",
      email: "demo@vling.com",
      name: "데모 사용자",
      passwordHash: DEMO_PASSWORD_HASH,
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
// Conditional Google provider (only if env vars are set)
// ---------------------------------------------------------------------------

const googleClientId = process.env.GOOGLE_CLIENT_ID ?? ""
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? ""
const hasGoogleCredentials = !!(googleClientId && googleClientSecret)

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

        const isValid = await bcrypt.compare(password, stored.passwordHash)
        if (!isValid) return null

        return {
          id: stored.id,
          email: stored.email,
          name: stored.name,
          role: stored.role,
          plan: stored.plan,
        }
      },
    }),
    ...(hasGoogleCredentials
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // user.id is typed as string | undefined in next-auth v5 beta
        token.id = (user.id ?? "") as string
        // Google OAuth users won't have role/plan — assign defaults
        token.role = ((user as { role?: UserRole }).role ?? "advertiser") as UserRole
        token.plan = ((user as { plan?: PlanTier }).plan ?? "basic") as PlanTier
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
