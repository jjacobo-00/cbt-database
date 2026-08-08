import React from "react"
import { Crown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function LeadershipPipelineLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <Crown className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-60 rounded-xl" />
          <Skeleton className="h-4 w-80 rounded-md" />
        </div>
      </div>

      {/* 5 KPI Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="rounded-2xl shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-28 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-3 w-36 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <Skeleton className="h-10 w-40 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Leadership Level Distribution Donut */}
        <Card className="rounded-2xl shadow-xs">
          <CardHeader className="space-y-1.5 pb-2">
            <Skeleton className="h-5 w-52 rounded-lg" />
            <Skeleton className="h-3 w-64 rounded-md" />
          </CardHeader>
          <CardContent className="h-[280px] flex items-center justify-center">
            <Skeleton className="h-44 w-44 rounded-full" />
          </CardContent>
        </Card>

        {/* Top Candidates Horizontal Bar Chart */}
        <Card className="rounded-2xl shadow-xs">
          <CardHeader className="space-y-1.5 pb-2">
            <Skeleton className="h-5 w-48 rounded-lg" />
            <Skeleton className="h-3 w-60 rounded-md" />
          </CardHeader>
          <CardContent className="h-[280px] flex flex-col justify-between py-4 px-2 space-y-2">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <Skeleton className="h-3 w-24 rounded-md" />
                <Skeleton className="h-5 rounded-r-md flex-1" style={{ width: `${45 + (j * 10) % 50}%` }} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Age Distribution Donut */}
        <Card className="rounded-2xl shadow-xs">
          <CardHeader className="space-y-1.5 pb-2">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="h-3 w-56 rounded-md" />
          </CardHeader>
          <CardContent className="h-[280px] flex items-center justify-center">
            <Skeleton className="h-44 w-44 rounded-full" />
          </CardContent>
        </Card>

        {/* Tenure Distribution Bar Chart */}
        <Card className="rounded-2xl shadow-xs">
          <CardHeader className="space-y-1.5 pb-2">
            <Skeleton className="h-5 w-44 rounded-lg" />
            <Skeleton className="h-3 w-56 rounded-md" />
          </CardHeader>
          <CardContent className="h-[280px] flex items-end gap-4 pt-6 px-4">
            {Array.from({ length: 3 }).map((_, k) => (
              <div key={k} className="flex-1 flex flex-col items-center gap-2">
                <Skeleton className="w-full rounded-t-lg" style={{ height: `${40 + (k * 25) % 55}%` }} />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
