"use server"

/**
 * Shared server-action helpers
 *
 * - requireAdmin()  — throws if no session or role !== "admin"
 * - ActionResult<T> — standard return type for all server actions
 */

import { auth } from "@/auth"

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Asserts the calling user is an authenticated admin.
 * Throws an Error (which Next.js surfaces as a 500 in dev, redirect in prod)
 * if the condition is not met.
 */
export async function requireAdmin(): Promise<void> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized: You must be signed in.")
  }
  if (session.user.role !== "admin") {
    throw new Error("Forbidden: Admin access required.")
  }
}

export async function requireAuth(): Promise<{ userId: string; role: "admin" | "member"; memberId?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized: You must be signed in.")
  }
  return {
    userId: session.user.id,
    role: (session.user.role as "admin" | "member") || "member",
    memberId: session.user.memberId,
  }
}

export async function requireSelfOrAdmin(targetMemberId: string): Promise<void> {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized: You must be signed in.")
  }
  if (session.user.role === "admin") {
    return
  }
  if (session.user.role === "member" && session.user.memberId === targetMemberId) {
    return
  }
  throw new Error("Forbidden: You do not have permission to access or modify this record.")
}

