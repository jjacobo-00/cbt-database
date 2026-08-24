import React from "react"
import { Church } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function MinistriesLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Church className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-8 sm:h-9 w-44 sm:w-56 rounded-xl" />
            <Skeleton className="h-4 w-64 sm:w-80 max-w-full rounded-md" />
          </div>
        </div>
        <Skeleton className="h-11 w-full sm:w-36 rounded-xl" />
      </div>

      {/* Search Toolbar Skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-full max-w-md rounded-xl" />
      </div>

      {/* Ministry Grid Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="rounded-2xl shadow-xs p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton
                  className="h-5 rounded-lg"
                  style={{ width: `${65 + ((i * 11) % 30)}%`, maxWidth: "200px" }}
                />
                <Skeleton className="h-3.5 w-full max-w-[240px] rounded-md" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            </div>

            <div className="flex items-center gap-3 pt-3 border-t">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-4 w-3/4 max-w-[140px] rounded-md" />
                <Skeleton className="h-3 w-1/2 max-w-[90px] rounded-md" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t text-xs">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
