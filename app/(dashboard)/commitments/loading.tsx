import React from "react"
import { HandHeart } from "lucide-react"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function CommitmentsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-full text-primary shrink-0">
          <HandHeart className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-8 sm:h-9 w-48 sm:w-56 rounded-xl" />
          <Skeleton className="h-4 w-64 sm:w-80 max-w-full rounded-md" />
        </div>
      </div>

      {/* Active Year Select Skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-20 rounded-md" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      {/* 3 Summary KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-2">
            <Skeleton className="h-4 w-44 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Commitments 4-Column Table Skeleton */}
      <TableSkeleton
        rows={8}
        showToolbar={true}
        showPresets={false}
        searchMaxWidth="max-w-sm"
        columnsCount={4}
        columnsConfig={[
          { width: "w-[34%]", titleWidth: "w-28" },
          { width: "w-[30%]", titleWidth: "w-24" },
          { width: "w-[24%]", titleWidth: "w-24" },
          { width: "w-[12%]", titleWidth: "w-16 ml-auto" },
        ]}
      />
    </div>
  )
}
