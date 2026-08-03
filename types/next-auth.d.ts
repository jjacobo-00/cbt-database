import { DefaultSession } from "next-auth"
import { JWT as DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      role?: "admin" | "member"
      memberId?: string
    } & DefaultSession["user"]
  }

  interface User {
    role?: "admin" | "member"
    memberId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "admin" | "member"
    memberId?: string
  }
}
