import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function MemberProfileLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Top Navigation & Action Buttons */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-28 rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>

      {/* Hero Member Header Card Skeleton */}
      <Card className="overflow-hidden border shadow-xs">
        {/* Top Cover Banner */}
        <div className="h-24 sm:h-32 bg-muted/60" />

        <CardContent className="pt-0 relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 mb-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              {/* Overlapping Avatar Box */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-card border-4 border-card shadow-lg -mt-12 sm:-mt-14 shrink-0 flex items-center justify-center">
                <Skeleton className="w-full h-full rounded-xl" />
              </div>

              <div className="space-y-2 pb-1">
                <Skeleton className="h-8 w-60 sm:w-72 rounded-xl mx-auto sm:mx-0" />
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-28 rounded-full" />
                </div>
              </div>
            </div>

            {/* Emergency Contact Box Skeleton */}
            <div className="w-full sm:w-auto p-3 rounded-xl border bg-muted/20 space-y-1">
              <Skeleton className="h-3 w-28 rounded-md" />
              <Skeleton className="h-4 w-40 rounded-md" />
            </div>
          </div>

          {/* Quick Info Contact Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t text-xs">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                <Skeleton className="h-4 w-36 rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation Strip Skeleton (7 Tabs) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {Array.from({ length: 7 }).map((_, idx) => (
          <Skeleton key={idx} className="h-10 w-28 sm:w-32 rounded-xl shrink-0" />
        ))}
      </div>

      {/* 2-Column Main Details Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal & Address Card */}
        <Card className="rounded-2xl shadow-xs">
          <CardHeader className="space-y-1.5 pb-3">
            <Skeleton className="h-5 w-48 rounded-lg" />
            <Skeleton className="h-3.5 w-60 rounded-md" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="space-y-1.5 p-2 rounded-lg bg-muted/20">
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Spiritual & Ministry Background Card */}
        <Card className="rounded-2xl shadow-xs">
          <CardHeader className="space-y-1.5 pb-3">
            <Skeleton className="h-5 w-48 rounded-lg" />
            <Skeleton className="h-3.5 w-64 rounded-md" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, k) => (
                <div key={k} className="space-y-1.5 p-2 rounded-lg bg-muted/20">
                  <Skeleton className="h-3 w-24 rounded-md" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
