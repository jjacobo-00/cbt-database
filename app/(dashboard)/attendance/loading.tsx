import React from "react"
import { CalendarCheck } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AttendanceLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <Skeleton className="h-8 sm:h-9 w-48 sm:w-60 rounded-xl" />
            <Skeleton className="h-4 w-64 sm:w-80 max-w-full rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Skeleton className="h-10 w-full sm:w-36 rounded-xl" />
          <Skeleton className="h-10 w-full sm:w-32 rounded-xl" />
        </div>
      </div>

      {/* Ministry Selector Filter Bar Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-32 rounded-xl shrink-0" />
        ))}
      </div>

      {/* 4 Attendance KPI Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} className="rounded-2xl shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-9 w-24 sm:w-28 rounded-lg" />
              <Skeleton className="h-3.5 w-40 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attendance Checklist / Table Container */}
      <Card className="rounded-2xl shadow-xs">
        <CardHeader className="space-y-1.5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Skeleton className="h-5 w-48 rounded-lg" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-full sm:w-40 rounded-xl" />
              <Skeleton className="h-9 w-full sm:w-28 rounded-xl" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 8 }).map((_, k) => (
            <div key={k} className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <Skeleton
                    className="h-4 rounded-md"
                    style={{ width: `${55 + ((k * 13) % 35)}%`, maxWidth: "200px" }}
                  />
                  <Skeleton className="h-3 w-28 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-20 rounded-xl hidden sm:block" />
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
