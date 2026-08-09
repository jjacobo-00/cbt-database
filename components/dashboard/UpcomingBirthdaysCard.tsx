"use client"

import React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Cake, ChevronRight, Sparkles, User2 } from "lucide-react"
import { formatName, formatBirthday } from "@/lib/utils/utils"

export interface Celebrant {
  id: string
  first_name: string
  last_name: string
  birth_date: string
  contact_number?: string | null
}

interface UpcomingBirthdaysCardProps {
  celebrantsThisMonth: Celebrant[]
  upcoming30Days: Celebrant[]
}

export function UpcomingBirthdaysCard({
  celebrantsThisMonth,
  upcoming30Days,
}: UpcomingBirthdaysCardProps) {
  const currentMonthName = new Date().toLocaleString("default", { month: "long" })
  const now = new Date()

  // Helper to compute countdown badge
  const getCountdownLabel = (bDateStr: string) => {
    const parts = String(bDateStr).split("T")[0].split("-")
    if (parts.length !== 3) return null
    const m = parseInt(parts[1], 10)
    const d = parseInt(parts[2], 10)
    if (isNaN(m) || !isNaN(d)) {
      const thisYearBday = new Date(now.getFullYear(), m - 1, d)
      if (thisYearBday < now && Math.abs(now.getDate() - d) > 0) {
        thisYearBday.setFullYear(now.getFullYear() + 1)
      }
      const diffTime = thisYearBday.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return { label: "🎉 Today!", isToday: true }
      if (diffDays === 1) return { label: "🎂 Tomorrow", isSoon: true }
      if (diffDays <= 7) return { label: `In ${diffDays} days`, isSoon: true }
      return { label: `In ${diffDays} days`, isSoon: false }
    }
    return null
  }

  return (
    <Card className="border shadow-xs overflow-hidden flex flex-col h-full bg-gradient-to-b from-card to-card/50">
      <CardHeader className="pb-3 border-b bg-pink-500/5 dark:bg-pink-950/10 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-pink-500/15 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold">
            <Cake className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <span>Birthday Celebrants</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-700 dark:text-pink-300 font-semibold">
                {currentMonthName} ({celebrantsThisMonth.length})
              </span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upcoming church birthdays in the next 30 days
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-xs text-pink-600 dark:text-pink-400 hover:text-pink-700 hover:bg-pink-500/10">
          <Link href="/members?birth_month=this_month">
            View All <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
        {upcoming30Days.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground flex flex-col items-center justify-center space-y-2">
            <Cake className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">No upcoming birthdays in the next 30 days.</p>
            <Button variant="outline" size="sm" asChild className="mt-2 text-xs">
              <Link href="/members?birth_month=this_month">Browse {currentMonthName} Celebrants</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/50 space-y-1">
            {upcoming30Days.slice(0, 5).map((member) => {
              const fullName = formatName(`${member.first_name} ${member.last_name}`)
              const countdown = getCountdownLabel(member.birth_date)
              const formattedDate = formatBirthday(member.birth_date)

              return (
                <Link
                  key={member.id}
                  href={`/members/${member.id}`}
                  className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center text-xs font-bold shrink-0">
                      {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                        {fullName}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Cake className="h-3 w-3 text-pink-500/70" />
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  {countdown && (
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                        countdown.isToday
                          ? "bg-pink-600 text-white animate-pulse"
                          : countdown.isSoon
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {countdown.label}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )}

        <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>{celebrantsThisMonth.length} celebrants in {currentMonthName}</span>
          <Link
            href="/members?birth_month=this_month"
            className="text-pink-600 dark:text-pink-400 hover:underline font-semibold flex items-center gap-0.5"
          >
            Open Celebrants List →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
