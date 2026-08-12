"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Cake, ChevronRight, Heart, Sparkles, User2 } from "lucide-react"
import { formatName, formatBirthday } from "@/lib/utils/utils"

export interface Celebrant {
  id: string
  first_name: string
  last_name: string
  birth_date: string
  contact_number?: string | null
}

export interface AnniversaryCelebrant {
  id: string
  spouse_member_id?: string | null
  couple_name: string
  anniversary_date: string
  milestone: string
  contact_number?: string | null
}

interface UpcomingBirthdaysCardProps {
  celebrantsThisMonth: Celebrant[]
  upcoming30Days: Celebrant[]
  anniversariesThisMonth?: AnniversaryCelebrant[]
  upcomingAnniversaries30Days?: AnniversaryCelebrant[]
}

export function UpcomingBirthdaysCard({
  celebrantsThisMonth,
  upcoming30Days,
  anniversariesThisMonth = [],
  upcomingAnniversaries30Days = [],
}: UpcomingBirthdaysCardProps) {
  const [activeTab, setActiveTab] = useState<"birthdays" | "anniversaries">("birthdays")
  const currentMonthName = new Date().toLocaleString("default", { month: "long" })
  const now = new Date()

  // Helper to compute countdown badge
  const getCountdownLabel = (dateStr: string, isAnniversary = false) => {
    const parts = String(dateStr).split("T")[0].split("-")
    if (parts.length !== 3) return null
    const m = parseInt(parts[1], 10)
    const d = parseInt(parts[2], 10)
    if (!isNaN(m) && !isNaN(d)) {
      const thisYearEvent = new Date(now.getFullYear(), m - 1, d)
      if (thisYearEvent < now && Math.abs(now.getDate() - d) > 0) {
        thisYearEvent.setFullYear(now.getFullYear() + 1)
      }
      const diffTime = thisYearEvent.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return { label: "🎉 Today!", isToday: true }
      if (diffDays === 1) return { label: isAnniversary ? "💍 Tomorrow" : "🎂 Tomorrow", isSoon: true }
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
            {activeTab === "birthdays" ? <Cake className="h-5 w-5" /> : <Heart className="h-5 w-5 fill-pink-500 text-pink-500" />}
          </div>
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <span>{activeTab === "birthdays" ? "Birthday Celebrants" : "Wedding Anniversaries"}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-700 dark:text-pink-300 font-semibold">
                {currentMonthName} ({activeTab === "birthdays" ? celebrantsThisMonth.length : anniversariesThisMonth.length})
              </span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeTab === "birthdays"
                ? "Upcoming church birthdays in the next 30 days"
                : "Upcoming wedding anniversaries in the next 30 days"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border">
          <button
            type="button"
            onClick={() => setActiveTab("birthdays")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
              activeTab === "birthdays"
                ? "bg-card text-pink-600 dark:text-pink-400 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Cake className="h-3.5 w-3.5" />
            <span>Birthdays ({celebrantsThisMonth.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("anniversaries")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
              activeTab === "anniversaries"
                ? "bg-card text-pink-600 dark:text-pink-400 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart className="h-3.5 w-3.5" />
            <span>Anniversaries ({anniversariesThisMonth.length})</span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
        {activeTab === "birthdays" ? (
          upcoming30Days.length === 0 ? (
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
                const countdown = getCountdownLabel(member.birth_date, false)
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
          )
        ) : upcomingAnniversaries30Days.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground flex flex-col items-center justify-center space-y-2">
            <Heart className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">No wedding anniversaries in the next 30 days.</p>
            <Button variant="outline" size="sm" asChild className="mt-2 text-xs">
              <Link href="/reports">View Celebrations Report</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/50 space-y-1">
            {upcomingAnniversaries30Days.slice(0, 5).map((ann) => {
              const countdown = getCountdownLabel(ann.anniversary_date, true)
              const formattedDate = formatBirthday(ann.anniversary_date)

              return (
                <Link
                  key={ann.id}
                  href={`/members/${ann.id}`}
                  className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xs font-bold shrink-0">
                      💍
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                        {ann.couple_name}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="font-medium text-rose-600 dark:text-rose-400">{ann.milestone}</span>
                        <span>•</span>
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  {countdown && (
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                        countdown.isToday
                          ? "bg-rose-600 text-white animate-pulse"
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
          <span>
            {activeTab === "birthdays"
              ? `${celebrantsThisMonth.length} birthday celebrants in ${currentMonthName}`
              : `${anniversariesThisMonth.length} wedding anniversaries in ${currentMonthName}`}
          </span>
          <Link
            href={activeTab === "birthdays" ? "/members?birth_month=this_month" : "/reports"}
            className="text-pink-600 dark:text-pink-400 hover:underline font-semibold flex items-center gap-0.5"
          >
            {activeTab === "birthdays" ? "Open Birthday Directory →" : "View Full Celebrations Report →"}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
