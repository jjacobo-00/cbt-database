import { DefaultSession } from "next-auth"
import { JWT as DefaultJWT } from "next-auth/jwt"

export type MemberPermissionsType = {
  can_manage_attendance: boolean
  attendance_ministry_ids: string[]
  can_manage_members?: boolean
  can_manage_offerings?: boolean
  can_view_reports?: boolean
}

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      role?: "admin" | "member"
      memberId?: string
      permissions?: MemberPermissionsType
    } & DefaultSession["user"]
  }

  interface User {
    role?: "admin" | "member"
    memberId?: string
    permissions?: MemberPermissionsType
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "admin" | "member"
    memberId?: string
    permissions?: MemberPermissionsType
  }
}
