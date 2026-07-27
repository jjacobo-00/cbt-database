"use client"
import React, { useState } from "react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { MobileBottomNav } from "./MobileBottomNav"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-muted/40 pb-24 sm:pb-0 relative">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="flex min-w-0 w-full max-w-full flex-col sm:gap-4 sm:py-4 sm:pl-64 overflow-x-hidden">
        <Header setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <main className="grid min-w-0 w-full max-w-full flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 overflow-x-hidden">
          {children}
        </main>
      </div>
      <MobileBottomNav isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
    </div>
  )
}
