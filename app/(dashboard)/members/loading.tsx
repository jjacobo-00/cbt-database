import React from "react"
import { Users } from "lucide-react"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function MembersLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header with Title and Add Member Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-48 rounded-xl" />
            <Skeleton className="h-4 w-64 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-11 w-40 rounded-xl" />
      </div>

      {/* Full Directory Table Skeleton */}
      <TableSkeleton rows={8} showToolbar={true} />
    </div>
  )
}
