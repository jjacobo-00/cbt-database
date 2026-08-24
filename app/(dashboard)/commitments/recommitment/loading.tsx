import React from "react"
import { RefreshCw } from "lucide-react"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function RecommitmentLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-full text-primary shrink-0">
          <RefreshCw className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-8 sm:h-9 w-64 sm:w-80 rounded-xl" />
          <Skeleton className="h-4 w-72 sm:w-96 max-w-full rounded-md" />
        </div>
      </div>

      {/* Target Year Select */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-48 rounded-md" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      {/* 3 Summary Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-36 rounded-md" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Skeleton className="h-10 w-full max-w-sm rounded-xl" />
        <div className="flex gap-1.5 flex-wrap">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Recommitment 4-Column Table Skeleton */}
      <TableSkeleton
        rows={8}
        showToolbar={false}
        columnsCount={4}
        columnsConfig={[
          { width: "w-[30%]", titleWidth: "w-28" },
          { width: "w-[34%]", titleWidth: "w-36" },
          { width: "w-[24%]", titleWidth: "w-28" },
          { width: "w-[12%]", titleWidth: "w-16 ml-auto" },
        ]}
      />
    </div>
  )
}
