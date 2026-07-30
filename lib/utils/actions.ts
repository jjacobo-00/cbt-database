import { revalidatePath } from "next/cache"

export type ActionResult<T = undefined> =
  | { success: true; data?: T; error?: undefined }
  | { success: false; data?: undefined; error: string }

/** Logs the failure and resolves to `fallback` — for read actions that must never throw. */
export async function safeQuery<T>(context: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    console.error(`Error ${context}:`, error)
    return fallback
  }
}

/**
 * Logs the failure and rethrows a user-facing message. `mapError` may return a more
 * specific message for a known failure (e.g. a unique constraint violation).
 */
export async function runAction<T>(
  context: string,
  message: string,
  fn: () => Promise<T>,
  mapError?: (error: unknown) => string | undefined
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    const mapped = mapError?.(error)
    if (mapped) throw new UserFacingError(mapped)
    if (error instanceof UserFacingError) throw error
    console.error(`Error ${context}:`, error)
    throw new Error(message)
  }
}

/** Logs the failure and converts it into an `ActionResult` for clients that read `success`. */
export async function runActionResult<T>(
  context: string,
  message: string,
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    return { success: true, data: await fn() }
  } catch (error) {
    console.error(`Error ${context}:`, error)
    return { success: false, error: error instanceof UserFacingError ? error.message : message }
  }
}

/** Error whose message is safe to surface to the user instead of the generic fallback. */
export class UserFacingError extends Error {}

export const REVALIDATE_GROUPS = {
  ministries: ["/ministries", "/members/new", "/commitments"],
  commitments: ["/commitments", "/commitments/recommitment", "/commitments/offerings"],
} as const

export function revalidatePaths(paths: readonly string[]) {
  for (const path of paths) revalidatePath(path)
}
