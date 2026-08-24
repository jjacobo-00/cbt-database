import React from "react"
import { ShieldCheck, Church, Users, UserPlus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function UsersLoading() {
  return (
    <div className="flex-1 space-y-6 p-3 sm:p-6 md:p-8 pt-4 sm:pt-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-7 w-7 text-primary" />
            <Skeleton className="h-8 md:h-9 w-60 sm:w-72 rounded-xl" />
          </div>
          <Skeleton className="h-4 w-72 sm:w-96 max-w-full rounded-md" />
        </div>
      </div>

      {/* 2-Tab Navigation Switcher */}
      <div className="grid w-full sm:w-80 grid-cols-2 h-11 p-1 bg-muted/60 rounded-xl gap-1">
        <Skeleton className="h-9 rounded-lg" />
        <Skeleton className="h-9 rounded-lg" />
      </div>

      {/* Top Action Bar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/40 p-4 sm:p-6 rounded-2xl border">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary/40" />
            <Skeleton className="h-5 w-64 rounded-md" />
          </div>
          <Skeleton className="h-3.5 w-72 sm:w-96 rounded-md" />
        </div>
        <Skeleton className="h-9 w-full sm:w-44 rounded-xl" />
      </div>

      {/* 4 Demographic Ministry Matrix Cards Skeleton (Laptop: 4 cols, Mobile: 1 col) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} className="rounded-2xl border shadow-xs p-4 sm:p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 flex-1">
                <Skeleton className="h-3 w-28 rounded-md" />
                <Skeleton className="h-5 w-36 rounded-md" />
              </div>
              <div className="p-2 rounded-xl bg-muted/60 shrink-0">
                <Church className="h-4 w-4 text-muted-foreground/40" />
              </div>
            </div>
            <Skeleton className="h-3.5 w-full rounded-md" />
            <div className="flex items-center justify-between pt-2 border-t text-xs">
              <Skeleton className="h-3 w-24 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </Card>
        ))}
      </div>

      {/* Officer Directory Card Skeleton */}
      <Card className="rounded-2xl shadow-xs">
        <CardHeader className="space-y-3 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Skeleton className="h-5 w-48 rounded-lg" />
            <Skeleton className="h-10 w-full sm:w-64 rounded-xl" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <Skeleton
                    className="h-4 rounded-md"
                    style={{ width: `${55 + ((i * 11) % 35)}%`, maxWidth: "200px" }}
                  />
                  <Skeleton className="h-3 w-32 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-6 w-28 rounded-full hidden sm:block" />
                <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
