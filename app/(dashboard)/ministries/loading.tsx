import React from "react"
import { Church } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

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
            <Skeleton className="h-7 w-40 rounded-xl" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-11 w-36 rounded-xl" />
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
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <Skeleton className="h-3.5 w-full rounded-md" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            </div>

            <div className="flex items-center gap-3 pt-2 border-t">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
