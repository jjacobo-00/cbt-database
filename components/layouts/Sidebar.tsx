"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, PieChart, Shield, Church, X, Menu, HandHeart, ChevronDown, Gift, RefreshCw, Network, MapPin, Target, DollarSign, Crown } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import Image from "next/image"

type NavItem = {
  name: string
  href?: string
  icon: any
  subItems?: { name: string; href: string; icon?: any }[]
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Members", href: "/members", icon: Users },
  { name: "Ministries", href: "/ministries", icon: Church },
  { name: "Missions", href: "/missions", icon: MapPin },
  { 
    name: "Commitments", 
    href: "/commitments",
    icon: HandHeart,
    subItems: [
      { name: "Ministry Commitments", href: "/commitments", icon: Church },
      { name: "Offering Commitments", href: "/commitments/offerings", icon: Gift },
      { name: "Recommitment Tracker", href: "/commitments/recommitment", icon: RefreshCw },
    ]
  },
  { name: "Reports", href: "/reports", icon: PieChart },
  { name: "Ministry Capacity", href: "/ministry-capacity", icon: Target },
  { name: "Stewardship", href: "/stewardship", icon: DollarSign },
  { name: "Leadership Pipeline", href: "/leadership-pipeline", icon: Crown },
  { name: "Org Chart", href: "/org-chart", icon: Network },
  { name: "Users", href: "/users", icon: Shield },
]

export function Sidebar({ 
  isMobileMenuOpen, 
  setIsMobileMenuOpen 
}: { 
  isMobileMenuOpen: boolean, 
  setIsMobileMenuOpen: (v: boolean) => void 
}) {
  const pathname = usePathname()
  const [openSubMenu, setOpenSubMenu] = useState<string | null>("Commitments")

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon
        const hasSub = !!item.subItems
        const isParentActive = item.href ? (item.href === "/commitments" ? pathname === "/commitments" || pathname.startsWith("/commitments/") : pathname.startsWith(item.href)) : false
        const isOpen = openSubMenu === item.name || isParentActive

        if (hasSub) {
          return (
            <div key={item.name} className="space-y-1">
              <button
                type="button"
                onClick={() => setOpenSubMenu(openSubMenu === item.name ? null : item.name)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
                  isParentActive ? "bg-muted/80 text-primary font-medium" : "text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
              </button>
              
              {isOpen && (
                <div className="ml-4 border-l pl-3 space-y-1 my-1">
                  {item.subItems?.map((sub) => {
                    const SubIcon = sub.icon
                    const isSubActive = sub.href === "/commitments" 
                      ? pathname === "/commitments"
                      : pathname.startsWith(sub.href)
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs transition-all hover:text-primary",
                          isSubActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted/50"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {SubIcon && <SubIcon className="h-3.5 w-3.5 shrink-0" />}
                        <span>{sub.name}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href!}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
              isParentActive ? "bg-muted text-primary font-medium" : "text-muted-foreground"
            )}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Icon className="h-4 w-4" />
            <span>{item.name}</span>
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex print:hidden">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
            <Image src="/logo.svg" alt="CBT Logo" width={32} height={32} className="object-contain" />
            <span>CBT Database</span>
          </Link>
        </div>
        <nav className="grid gap-1 px-2 py-4 lg:px-4">
          <NavLinks />
        </nav>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm sm:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      {/* Mobile Drawer */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 border-r bg-background shadow-lg transition-transform duration-300 ease-in-out sm:hidden flex flex-col",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
            <Image src="/logo.svg" alt="CBT Logo" width={32} height={32} className="object-contain" />
            <span>CBT Database</span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-muted-foreground hover:text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="grid gap-1 px-2 py-4">
          <NavLinks />
        </nav>
      </aside>
    </>
  )
}
