import React from "react"
import { HandHeart } from "lucide-react"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function CommitmentsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <HandHeart className="h-6 w-6" />
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <Skeleton className="h-8 sm:h-9 w-48 sm:w-56 rounded-xl" />
            <Skeleton className="h-4 w-64 sm:w-80 max-w-full rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Skeleton className="h-10 w-full sm:w-28 rounded-xl" />
          <Skeleton className="h-10 w-full sm:w-36 rounded-xl" />
        </div>
      </div>

      {/* 3 Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="rounded-2xl shadow-xs">
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

      {/* Commitments Table Skeleton */}
      <TableSkeleton rows={8} showToolbar={true} />
    </div>
  )
}
