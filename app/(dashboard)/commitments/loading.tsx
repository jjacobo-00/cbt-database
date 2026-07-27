import React from "react"
import { HandHeart } from "lucide-react"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function CommitmentsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-full">
          <HandHeart className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commitments</h1>
          <p className="text-muted-foreground">Loading yearly commitments data...</p>
        </div>
      </div>
      
      {/* Summary cards skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="rounded-xl border bg-card p-5">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="rounded-xl border bg-card p-5">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      <TableSkeleton />
    </div>
  )
}
