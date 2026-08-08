import React from "react"
import { MapPin } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function MissionsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <MapPin className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-48 rounded-xl" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-11 w-44 rounded-xl" />
      </div>

      {/* Missions Grid Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="rounded-2xl shadow-xs p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-5 w-44 rounded-lg" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-3.5 w-3.5 rounded-full" />
                  <Skeleton className="h-3.5 w-32 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            </div>

            <div className="flex items-center gap-3 pt-3 border-t">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t text-xs">
              <Skeleton className="h-4 w-28 rounded-md" />
              <div className="flex items-center gap-1">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
