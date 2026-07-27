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
      <div className="flex min-w-0 flex-col sm:gap-4 sm:py-4 sm:pl-64">
        <Header setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <main className="grid min-w-0 flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
      <MobileBottomNav isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
    </div>
  )
}
