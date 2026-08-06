"use client"

import React, { useEffect } from "react"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/ThemeProvider"

// Global Pointer Events Reset Safeguard on Modal Close / Navigation
function PointerEventsResetter() {
  useEffect(() => {
    const checkAndReset = () => {
      const openModals = document.querySelectorAll(
        '[data-state="open"][role="dialog"], [data-state="open"][role="alertdialog"], [data-state="open"][role="menu"]'
      )
      if (openModals.length === 0 && document.body.style.pointerEvents === "none") {
        document.body.style.pointerEvents = ""
      }
    }

    const observer = new MutationObserver(() => {
      checkAndReset()
    })

    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] })

    return () => {
      observer.disconnect()
    }
  }, [])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <PointerEventsResetter />
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
