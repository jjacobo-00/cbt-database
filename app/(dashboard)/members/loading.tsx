import React from "react"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function MembersLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header with Title and Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Skeleton className="h-9 w-64 sm:w-72 rounded-xl" />
        <div className="flex gap-2 w-full sm:w-auto">
          <Skeleton className="h-10 flex-1 sm:w-36 rounded-xl" />
          <Skeleton className="h-10 flex-1 sm:w-36 rounded-xl" />
        </div>
      </div>

      {/* Full Directory Table Skeleton with Presets */}
      <TableSkeleton
        rows={8}
        showToolbar={true}
        showPresets={true}
        columnsCount={5}
        columnsConfig={[
          { width: "w-[30%]", titleWidth: "w-28" },
          { width: "w-[22%]", titleWidth: "w-24" },
          { width: "w-[20%]", titleWidth: "w-20" },
          { width: "w-[16%]", titleWidth: "w-16" },
          { width: "w-[12%]", titleWidth: "w-14 ml-auto" },
        ]}
      />
    </div>
  )
}
