import React from "react"
import { Gift } from "lucide-react"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function OfferingsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-full text-primary shrink-0">
          <Gift className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-8 sm:h-9 w-60 sm:w-72 rounded-xl" />
          <Skeleton className="h-4 w-72 sm:w-96 max-w-full rounded-md" />
        </div>
      </div>

      {/* 2-Tab Navigation Header */}
      <div className="flex border-b gap-6 pb-2">
        <Skeleton className="h-6 w-56 rounded-md" />
        <Skeleton className="h-6 w-48 rounded-md" />
      </div>

      {/* Offerings 3-Column Table Skeleton */}
      <TableSkeleton
        rows={8}
        showToolbar={true}
        showPresets={false}
        searchMaxWidth="max-w-sm"
        columnsCount={3}
        columnsConfig={[
          { width: "w-[40%]", titleWidth: "w-28" },
          { width: "w-[40%]", titleWidth: "w-28" },
          { width: "w-[20%]", titleWidth: "w-28 ml-auto" },
        ]}
      />
    </div>
  )
}
