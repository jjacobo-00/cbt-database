"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, HandHeart, Menu } from "lucide-react"
import { cn } from "@/lib/utils/utils"

export function MobileBottomNav({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (v: boolean) => void
}) {
  const pathname = usePathname()

  const navItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Members", href: "/members", icon: Users },
    { name: "Commitments", href: "/commitments", icon: HandHeart },
  ]

  const triggerHaptic = () => {
    if (typeof window !== "undefined" && window.navigator?.vibrate) {
      try {
        window.navigator.vibrate(10)
      } catch (e) {
        // Safe fallback
      }
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 sm:hidden items-center justify-around border-t bg-background/80 backdrop-blur-xl px-2 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = item.href === "/commitments" 
          ? pathname === "/commitments" || pathname.startsWith("/commitments/") 
          : pathname.startsWith(item.href)

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => {
              triggerHaptic()
              setIsMobileMenuOpen(false)
            }}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-all select-none",
              isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className={cn(
              "flex items-center justify-center rounded-full px-3 py-1 transition-all duration-200",
              isActive ? "bg-primary/10 text-primary shadow-xs" : ""
            )}>
              <Icon className={cn("h-5 w-5", isActive && "fill-primary/20")} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={cn("text-[10px] font-medium tracking-tight", isActive ? "text-primary font-bold" : "")}>
              {item.name}
            </span>
          </Link>
        )
      })}

      {/* Menu / More Button */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic()
          setIsMobileMenuOpen(!isMobileMenuOpen)
        }}
        className={cn(
          "flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-all select-none",
          isMobileMenuOpen ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <div className={cn(
          "flex items-center justify-center rounded-full px-3 py-1 transition-all duration-200",
          isMobileMenuOpen ? "bg-primary/10 text-primary shadow-xs" : ""
        )}>
          <Menu className="h-5 w-5" strokeWidth={isMobileMenuOpen ? 2.5 : 2} />
        </div>
        <span className={cn("text-[10px] font-medium tracking-tight", isMobileMenuOpen ? "text-primary font-bold" : "")}>
          Menu
        </span>
      </button>
    </nav>
  )
}
