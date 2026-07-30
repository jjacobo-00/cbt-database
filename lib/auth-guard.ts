import { auth } from "@/auth"

/**
 * Ensures a request comes from an authenticated session.
 * Server Actions are reachable from any route (including public ones such as
 * /invite/[token]), so proxy-level protection alone is not sufficient.
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  return session
}
