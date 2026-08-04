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
