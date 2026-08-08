import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border bg-card p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-3 w-36 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main Content Area / Table Container */}
      <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b">
          <Skeleton className="h-6 w-44 rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40 rounded-lg" />
                  <Skeleton className="h-3 w-28 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
