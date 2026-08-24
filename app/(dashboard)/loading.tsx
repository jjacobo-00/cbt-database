import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 w-full sm:w-auto flex-1 max-w-xl">
          <Skeleton className="h-8 md:h-9 w-3/4 max-w-sm rounded-xl" />
          <Skeleton className="h-4 w-full max-w-md rounded-lg" />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Skeleton className="h-10 w-full sm:w-32 rounded-xl" />
          <Skeleton className="h-10 w-full sm:w-36 rounded-xl" />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border bg-card p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            </div>
            <Skeleton className="h-9 w-24 sm:w-28 rounded-lg" />
            <Skeleton className="h-3.5 w-40 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main Content Area / Container */}
      <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </div>

        {/* Desktop Rows */}
        <div className="hidden md:block space-y-3 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
              <div className="flex items-center gap-3.5 flex-1">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton
                    className="h-4 rounded-md"
                    style={{ width: `${50 + ((i * 15) % 35)}%`, maxWidth: "240px" }}
                  />
                  <Skeleton className="h-3 w-32 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Cards */}
        <div className="grid grid-cols-1 gap-3 md:hidden pt-1">
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j} className="p-4 rounded-xl border bg-muted/20 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <Skeleton className="h-3 w-28 rounded-md" />
                <Skeleton className="h-7 w-16 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
