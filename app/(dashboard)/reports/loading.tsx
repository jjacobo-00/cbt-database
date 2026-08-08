import React from "react"
import { BarChart3 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ReportsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header with Title and Date Filter Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <BarChart3 className="h-6 w-6" />
            </div>
            <Skeleton className="h-8 w-60 rounded-xl" />
          </div>
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>
        <Skeleton className="h-10 w-48 rounded-xl" />
      </div>

      {/* Tab Triggers Strip Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-36 rounded-xl shrink-0" />
        ))}
      </div>

      {/* 5-Column KPI Cards Grid */}
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Card key={idx} className="rounded-2xl shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-28 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-3 w-32 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Visual Analytics Charts Grid Skeleton */}
      <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {/* Gender Distribution Donut Chart */}
        <Card className="col-span-1 min-w-0 rounded-2xl shadow-xs">
          <CardHeader className="space-y-1.5 pb-2">
            <Skeleton className="h-5 w-36 rounded-lg" />
            <Skeleton className="h-3 w-48 rounded-md" />
          </CardHeader>
          <CardContent className="h-[240px] flex flex-col items-center justify-center gap-3">
            <Skeleton className="h-36 w-36 rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          </CardContent>
        </Card>

        {/* Marital Status Bar Chart */}
        <Card className="col-span-1 md:col-span-1 xl:col-span-2 min-w-0 rounded-2xl shadow-xs">
          <CardHeader className="space-y-1.5 pb-2">
            <Skeleton className="h-5 w-32 rounded-lg" />
            <Skeleton className="h-3 w-48 rounded-md" />
          </CardHeader>
          <CardContent className="h-[240px] flex items-end gap-3 pt-6 px-4">
            {Array.from({ length: 4 }).map((_, k) => (
              <div key={k} className="flex-1 flex flex-col items-center gap-2">
                <Skeleton className="w-full rounded-t-lg" style={{ height: `${35 + (k * 20) % 60}%` }} />
                <Skeleton className="h-3 w-12 rounded-md" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Age Demographics Bar Chart */}
        <Card className="col-span-1 md:col-span-2 min-w-0 rounded-2xl shadow-xs">
          <CardHeader className="space-y-1.5 pb-2">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="h-3 w-52 rounded-md" />
          </CardHeader>
          <CardContent className="h-[260px] flex items-end gap-3 pt-6 px-4">
            {Array.from({ length: 6 }).map((_, m) => (
              <div key={m} className="flex-1 flex flex-col items-center gap-2">
                <Skeleton className="w-full rounded-t-lg" style={{ height: `${25 + (m * 18) % 70}%` }} />
                <Skeleton className="h-3 w-16 rounded-md" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Mission Church Branches Bar Chart */}
        <Card className="col-span-1 md:col-span-2 min-w-0 rounded-2xl shadow-xs">
          <CardHeader className="space-y-1.5 pb-2">
            <Skeleton className="h-5 w-56 rounded-lg" />
            <Skeleton className="h-3 w-64 rounded-md" />
          </CardHeader>
          <CardContent className="h-[260px] flex items-end gap-3 pt-6 px-4">
            {Array.from({ length: 5 }).map((_, n) => (
              <div key={n} className="flex-1 flex flex-col items-center gap-2">
                <Skeleton className="w-full rounded-t-lg" style={{ height: `${30 + (n * 22) % 65}%` }} />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
