import React from "react"
import { MapPin, Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function MissionsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 sm:h-9 w-52 sm:w-64 rounded-xl" />
          <Skeleton className="h-4 w-72 sm:w-96 max-w-full rounded-md" />
        </div>
        <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
          <MapPin className="h-6 w-6" />
        </div>
      </div>

      {/* 4 Summary KPI Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-t-4 border-t-primary/30 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            </CardHeader>
            <CardContent className="space-y-1.5">
              <Skeleton className="h-9 w-20 rounded-lg" />
              <Skeleton className="h-3.5 w-40 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Tabs Filter Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <Skeleton className="h-10 w-full sm:w-72 max-w-md rounded-xl" />
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 h-10 w-full sm:w-72">
            <Skeleton className="h-8 flex-1 rounded-lg" />
            <Skeleton className="h-8 flex-1 rounded-lg" />
            <Skeleton className="h-8 flex-1 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-10 w-full sm:w-44 rounded-xl shrink-0" />
      </div>

      {/* Mission Cards Grid (3 Columns on PC/Laptop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Card key={idx} className="rounded-2xl shadow-xs p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton
                  className="h-5 rounded-lg"
                  style={{ width: `${60 + ((idx * 13) % 35)}%`, maxWidth: "220px" }}
                />
                <div className="flex items-center gap-1.5 pt-0.5">
                  <Skeleton className="h-3.5 w-3.5 rounded-full shrink-0" />
                  <Skeleton className="h-3.5 w-32 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-6 w-24 rounded-full shrink-0" />
            </div>

            <div className="flex items-center gap-3 pt-3 border-t">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-4 w-3/4 max-w-[140px] rounded-md" />
                <Skeleton className="h-3 w-1/2 max-w-[90px] rounded-md" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t text-xs">
              <Skeleton className="h-4 w-28 rounded-md" />
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
