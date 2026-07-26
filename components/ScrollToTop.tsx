"use client"

import React, { useState, useEffect } from "react"
import { ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils/utils"

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", toggleVisibility)
    return () => window.removeEventListener("scroll", toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  if (!isVisible) return null

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={cn(
        "fixed bottom-6 right-6 z-50 p-3 rounded-2xl shadow-xl transition-all duration-300 transform",
        "bg-primary text-primary-foreground border border-primary/40 shadow-primary/25",
        "hover:scale-110 hover:-translate-y-1 active:scale-95 flex items-center justify-center",
        "animate-in fade-in zoom-in-95 duration-200"
      )}
    >
      <ArrowUp className="h-5 w-5 stroke-[2.5]" />
    </button>
  )
}
