import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function MyProfileLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Hero Profile Banner Skeleton */}
      <div className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full shrink-0 shadow-inner" />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-7 w-48 rounded-lg" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-4 w-36 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation Strip Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Skeleton key={idx} className="h-9 w-28 rounded-xl shrink-0" />
        ))}
      </div>

      {/* Overview 3-Column Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="rounded-2xl shadow-xs">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-3 w-40 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Details Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl shadow-xs">
          <CardHeader className="space-y-1.5 pb-3">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="h-3 w-56 rounded-md" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="space-y-1">
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <Skeleton className="h-4 w-28 rounded-md" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-xs">
          <CardHeader className="space-y-1.5 pb-3">
            <Skeleton className="h-5 w-44 rounded-lg" />
            <Skeleton className="h-3 w-60 rounded-md" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, k) => (
                <div key={k} className="space-y-1">
                  <Skeleton className="h-3 w-24 rounded-md" />
                  <Skeleton className="h-4 w-32 rounded-md" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
