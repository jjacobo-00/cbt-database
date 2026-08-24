import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function InviteLoading() {
  return (
    <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 md:p-10 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-2 text-center sm:text-left">
        <Skeleton className="h-8 sm:h-9 w-64 sm:w-80 rounded-xl mx-auto sm:mx-0" />
        <Skeleton className="h-4 w-full max-w-lg rounded-md mx-auto sm:mx-0" />
      </div>

      {/* Pre-configured Assignment Badge */}
      <div className="p-4 rounded-xl border bg-primary/5 border-primary/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
          <div className="space-y-1 flex-1 min-w-0">
            <Skeleton className="h-3 w-28 rounded-md" />
            <Skeleton className="h-4 w-44 max-w-full rounded-md" />
          </div>
        </div>
        <Skeleton className="h-6 w-28 rounded-full shrink-0" />
      </div>

      {/* Form Fields Card Skeleton */}
      <Card className="rounded-2xl shadow-xs p-6 space-y-6">
        <div className="space-y-2 border-b pb-4">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-3.5 w-full max-w-md rounded-md" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ))}
        </div>

        <div className="pt-6 border-t flex justify-end">
          <Skeleton className="h-12 w-full sm:w-40 rounded-xl" />
        </div>
      </Card>
    </div>
  )
}
