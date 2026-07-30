/**
 * Extracts a user-presentable message from an unknown thrown value.
 *
 * Errors thrown by Server Actions are redacted in production builds: the
 * message is replaced by a generic string and a `digest` is attached. Those
 * are reported with the caller's fallback instead of the redacted text.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message && !("digest" in error)) {
    return error.message
  }
  return fallback
}
