import React from "react"
import { Network } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function OrgChartLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Network className="h-6 w-6" />
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <Skeleton className="h-8 sm:h-9 w-48 sm:w-60 rounded-xl" />
            <Skeleton className="h-4 w-64 sm:w-80 max-w-full rounded-md" />
          </div>
        </div>
        <Skeleton className="h-10 w-full sm:w-32 rounded-xl" />
      </div>

      {/* Org Chart Hierarchy Tree Nodes Skeleton */}
      <div className="space-y-4 max-w-3xl py-2">
        {/* Root Leader Card (Level 0) */}
        <div className="p-4 rounded-xl border bg-card shadow-md flex items-center justify-between border-primary/40">
          <div className="flex items-center gap-3 w-full">
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-5 w-44 rounded-lg" />
              <Skeleton className="h-3.5 w-32 rounded-md" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Level 1 & Level 2 Tree Children with Spine Lines */}
        <div className="relative pl-6 sm:pl-10 space-y-3">
          <div className="absolute left-4 sm:left-6 top-0 bottom-4 w-[2px] bg-border" />
          
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="relative">
              <div className="absolute -left-6 top-6 w-6 h-[2px] bg-border" />
              <div className="p-3.5 rounded-xl border bg-card shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3 w-full">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <Skeleton className="h-4 w-36 rounded-lg" />
                    <Skeleton className="h-3 w-28 rounded-md" />
                  </div>
                  <div className="flex gap-1">
                    <Skeleton className="h-7 w-7 rounded-lg" />
                    <Skeleton className="h-7 w-7 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
