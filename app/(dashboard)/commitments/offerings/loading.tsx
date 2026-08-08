import React from "react"
import { Gift } from "lucide-react"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function OfferingsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Gift className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-60 rounded-xl" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-11 w-40 rounded-xl" />
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
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

      {/* Offerings Table Skeleton */}
      <TableSkeleton rows={6} showToolbar={true} />
    </div>
  )
}
