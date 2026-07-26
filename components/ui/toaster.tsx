"use client"

import { Toaster as Sonner } from "sonner"

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      richColors
      closeButton
      theme="system"
      className="font-sans"
      toastOptions={{
        style: {
          borderRadius: "1rem",
          padding: "1rem 1.25rem",
        },
      }}
    />
  )
}
