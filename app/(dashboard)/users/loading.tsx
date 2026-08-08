import React from "react"
import { ShieldCheck } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function UsersLoading() {
  return (
    <div className="flex-1 space-y-6 p-3 sm:p-6 md:p-8 pt-4 sm:pt-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <Skeleton className="h-8 w-60 rounded-xl" />
          </div>
          <Skeleton className="h-4 w-96 rounded-md mt-2" />
        </div>
      </div>

      {/* 2-Tab Switcher Skeleton */}
      <div className="flex items-center gap-2 max-w-md">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 flex-1 rounded-xl" />
      </div>

      {/* Users & Permissions Table / Cards Skeleton */}
      <Card className="rounded-2xl shadow-xs">
        <CardHeader className="space-y-1.5 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Skeleton className="h-5 w-48 rounded-lg" />
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
          <Skeleton className="h-3.5 w-72 rounded-md" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-44 rounded-lg" />
                  <Skeleton className="h-3 w-32 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
