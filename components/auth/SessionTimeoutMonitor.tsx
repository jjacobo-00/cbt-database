"use client"

import { useEffect, useRef } from "react"
import { useSession, signOut } from "next-auth/react"

export function SessionTimeoutMonitor() {
  const { data: session, status } = useSession()
  const isLoggingOutRef = useRef(false)

  useEffect(() => {
    if (status !== "authenticated" || !session) {
      isLoggingOutRef.current = false
      return
    }

    const handleAutoLogout = async () => {
      if (isLoggingOutRef.current) return
      isLoggingOutRef.current = true
      try {
        await signOut({ callbackUrl: "/login?info=session_expired" })
      } catch (error) {
        console.error("Failed to auto sign-out expired session:", error)
        window.location.href = "/login?info=session_expired"
      }
    }

    const checkSessionExpiration = () => {
      const now = Date.now()

      // Check session.expiresAt if provided from JWT exp
      if (session.expiresAt && typeof session.expiresAt === "number") {
        if (now >= session.expiresAt) {
          handleAutoLogout()
          return
        }
      } else if (session.expires) {
        // Fallback to session.expires string
        const expDate = new Date(session.expires).getTime()
        if (!isNaN(expDate) && now >= expDate) {
          handleAutoLogout()
          return
        }
      }
    }

    // 1. Initial check on mount or session update
    checkSessionExpiration()

    // 2. Periodic check every 30 seconds
    const intervalId = setInterval(checkSessionExpiration, 30 * 1000)

    // 3. Check when window receives focus or tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSessionExpiration()
      }
    }

    window.addEventListener("focus", checkSessionExpiration)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener("focus", checkSessionExpiration)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [session, status])

  return null
}
