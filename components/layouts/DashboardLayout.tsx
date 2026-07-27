"use client"
import React, { useState } from "react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { MobileBottomNav } from "./MobileBottomNav"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-muted/40 pb-24 sm:pb-0 relative print:bg-white print:pb-0">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="flex min-w-0 w-full max-w-full flex-col sm:gap-4 sm:py-4 sm:pl-64 overflow-x-hidden print:pl-0 print:pt-0 print:py-0 print:gap-0">
        <Header setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <main className="grid min-w-0 w-full max-w-full flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 overflow-x-hidden print:p-0 print:m-0 print:gap-0">
          {children}
        </main>
      </div>
      <MobileBottomNav isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
    </div>
  )
}
