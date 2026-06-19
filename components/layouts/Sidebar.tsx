"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, PieChart, Shield, X, Menu } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import Image from "next/image"

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Members", href: "/members", icon: Users },
  { name: "Reports", href: "/reports", icon: PieChart },
  { name: "Staff", href: "/staff", icon: Shield },
]

export function Sidebar({ 
  isMobileMenuOpen, 
  setIsMobileMenuOpen 
}: { 
  isMobileMenuOpen: boolean, 
  setIsMobileMenuOpen: (v: boolean) => void 
}) {
  const pathname = usePathname()

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
              isActive ? "bg-muted text-primary" : "text-muted-foreground"
            )}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
            <Image src="/logo.svg" alt="CBT Logo" width={32} height={32} className="object-contain" />
            <span className="">CBT Directory</span>
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
            <span>CBT Directory</span>
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
