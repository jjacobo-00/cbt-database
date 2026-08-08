import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function DashboardPageLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Hero Banner Skeleton */}
      <div className="p-6 rounded-2xl border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-4 w-80 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-2xl shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-28 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-3 w-40 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 2-Column Visual Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Chart 1: Ministry Demographics */}
        <Card className="rounded-2xl shadow-xs">
          <CardHeader className="space-y-1.5 pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-44 rounded-lg" />
              <Skeleton className="h-7 w-24 rounded-lg" />
            </div>
            <Skeleton className="h-3 w-64 rounded-md" />
          </CardHeader>
          <CardContent className="h-[280px] flex items-center justify-center">
            <Skeleton className="h-44 w-44 rounded-full" />
          </CardContent>
        </Card>

        {/* Chart 2: Faith Promise / Giving Distribution */}
        <Card className="rounded-2xl shadow-xs">
          <CardHeader className="space-y-1.5 pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-48 rounded-lg" />
              <Skeleton className="h-7 w-24 rounded-lg" />
            </div>
            <Skeleton className="h-3 w-60 rounded-md" />
          </CardHeader>
          <CardContent className="h-[280px] flex items-end gap-3 pt-6 px-4">
            {Array.from({ length: 7 }).map((_, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <Skeleton className="w-full rounded-t-lg" style={{ height: `${30 + (idx * 15) % 70}%` }} />
                <Skeleton className="h-3 w-8 rounded-md" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Members Table Skeleton */}
      <Card className="rounded-2xl shadow-xs">
        <CardHeader className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-xl" />
          </div>
          <Skeleton className="h-3 w-56 rounded-md" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36 rounded-lg" />
                    <Skeleton className="h-3 w-28 rounded-md" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-20 rounded-full hidden sm:block" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
