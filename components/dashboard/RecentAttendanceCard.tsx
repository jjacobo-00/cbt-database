"use client"

import React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  CalendarCheck,
  ChevronRight,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Users,
  CheckCircle,
} from "lucide-react"
import { formatBirthday } from "@/lib/utils/utils"

export interface FellowshipTurnout {
  ministryId: string
  ministryName: string
  presentCount: number
  totalEnrolled: number
  percentage: number
}

export interface LatestServiceAttendance {
  date: string
  serviceTime: string
  weatherCondition: string | null
  weatherSummary: string | null
  weatherTempC: string | null
  weatherIcon: string | null
  totalPresent: number
  totalEnrolled: number
  percentage: number
  fellowships: FellowshipTurnout[]
}

interface RecentAttendanceCardProps {
  latestService: LatestServiceAttendance | null
}

export function RecentAttendanceCard({ latestService }: RecentAttendanceCardProps) {
  if (!latestService) {
    return (
      <Card className="border shadow-xs overflow-hidden flex flex-col h-full bg-gradient-to-b from-card to-card/50">
        <CardHeader className="pb-3 border-b bg-emerald-500/5 dark:bg-emerald-950/10 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Ministry Attendance</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Latest service turnout</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-500/10">
            <Link href="/attendance">
              Open Attendance <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-6 flex-1 flex flex-col items-center justify-center text-center space-y-3">
          <CalendarCheck className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">No attendance sessions recorded yet.</p>
          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Link href="/attendance">Record First Attendance</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const formattedDate = formatBirthday(latestService.date)
  const isMorning = latestService.serviceTime === "AM"
  const serviceLabel = isMorning ? "Morning Service (AM)" : "Afternoon Service (PM)"

  // Weather badge styling
  const isStormy = latestService.weatherCondition === "stormy"
  const isRainy = latestService.weatherCondition === "rainy"

  const weatherBadgeBg = isStormy
    ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30"
    : isRainy
    ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
    : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"

  const WeatherIcon =
    latestService.weatherIcon === "cloud-lightning"
      ? CloudLightning
      : latestService.weatherIcon === "cloud-rain"
      ? CloudRain
      : latestService.weatherIcon === "cloud"
      ? Cloud
      : Sun

  // Fellowship color mapping
  const getFellowshipColor = (name: string) => {
    const lower = name.toLowerCase()
    if (lower.includes("men")) return { bar: "bg-blue-600", text: "text-blue-700 dark:text-blue-300", bg: "bg-blue-500/10" }
    if (lower.includes("ladies")) return { bar: "bg-pink-600", text: "text-pink-700 dark:text-pink-300", bg: "bg-pink-500/10" }
    return { bar: "bg-purple-600", text: "text-purple-700 dark:text-purple-300", bg: "bg-purple-500/10" }
  }

  return (
    <Card className="border shadow-xs overflow-hidden flex flex-col h-full bg-gradient-to-b from-card to-card/50">
      <CardHeader className="pb-3 border-b bg-emerald-500/5 dark:bg-emerald-950/10 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CalendarCheck className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <span>Latest Attendance</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold">
                {latestService.percentage}% Turnout
              </span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formattedDate} • {serviceLabel}
            </p>
          </div>
        </div>

        <Button variant="ghost" size="sm" asChild className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-500/10">
          <Link href="/attendance">
            Record / Edit <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Weather Indicator Context */}
        {latestService.weatherSummary && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border ${weatherBadgeBg}`}>
            <WeatherIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{latestService.weatherSummary}</span>
          </div>
        )}

        {/* Overall Turnout Progress Bar */}
        <div className="space-y-1.5 p-3.5 rounded-xl bg-muted/40 border">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-emerald-600" />
              Total Turnout
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {latestService.totalPresent} / {latestService.totalEnrolled} ({latestService.percentage}%)
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, latestService.percentage)}%` }}
            />
          </div>
        </div>

        {/* Fellowship Breakdown List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Fellowship Breakdown</h4>
          <div className="space-y-2.5">
            {latestService.fellowships.map((f) => {
              const colors = getFellowshipColor(f.ministryName)
              return (
                <div key={f.ministryId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{f.ministryName}</span>
                    <span className="text-muted-foreground font-semibold">
                      <strong className="text-foreground">{f.presentCount}</strong> / {f.totalEnrolled} ({f.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(100, f.percentage)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Card Footer Quick Links */}
        <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>{latestService.fellowships.length} Core Fellowships</span>
          <Link
            href="/attendance"
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-0.5"
          >
            Open Attendance Hub →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
