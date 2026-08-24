import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function DashboardPageLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Hero Banner Skeleton */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2.5 w-full md:w-auto flex-1 max-w-2xl">
            <Skeleton className="h-6 w-44 rounded-full" />
            <Skeleton className="h-8 md:h-9 w-3/4 max-w-md rounded-xl" />
            <Skeleton className="h-4 w-full max-w-xl rounded-md" />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Skeleton className="h-11 w-full sm:w-36 rounded-xl" />
            <Skeleton className="h-11 w-full sm:w-32 rounded-xl" />
          </div>
        </div>
      </div>

      {/* 4 Top KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-2xl shadow-xs border-t-4 border-t-muted">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-9 w-24 sm:w-28 rounded-lg" />
              <Skeleton className="h-3.5 w-44 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Growth Chart Skeleton */}
      <Card className="rounded-2xl shadow-xs">
        <CardHeader className="space-y-1.5 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <Skeleton className="h-5 w-48 rounded-lg" />
            <Skeleton className="h-7 w-32 rounded-lg" />
          </div>
          <Skeleton className="h-3.5 w-72 rounded-md" />
        </CardHeader>
        <CardContent className="h-[280px] sm:h-[320px] flex items-end gap-3 pt-6 px-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <Skeleton
                className="w-full rounded-t-lg"
                style={{ height: `${25 + ((idx * 17) % 65)}%` }}
              />
              <Skeleton className="h-3 w-6 rounded-md hidden sm:block" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 2-Column Section: Attendance Snapshot & Celebrants Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Snapshot Card */}
        <Card className="rounded-2xl shadow-xs">
          <CardHeader className="space-y-1.5 pb-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-44 rounded-lg" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-60 rounded-md" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
            <div className="space-y-2 pt-2 border-t">
              {Array.from({ length: 3 }).map((_, a) => (
                <div key={a} className="flex items-center justify-between py-1">
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Celebrants Card */}
        <Card className="rounded-2xl shadow-xs">
          <CardHeader className="space-y-1.5 pb-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-48 rounded-lg" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-64 rounded-md" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, c) => (
              <div key={c} className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-36 rounded-md" />
                    <Skeleton className="h-3 w-24 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Members Table Skeleton */}
      <Card className="rounded-2xl shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="space-y-1">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="h-3.5 w-56 rounded-md" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="px-4 py-3 text-left w-[35%]"><Skeleton className="h-4 w-24 rounded-md" /></th>
                  <th className="px-4 py-3 text-left w-[25%]"><Skeleton className="h-4 w-20 rounded-md" /></th>
                  <th className="px-4 py-3 text-left w-[20%]"><Skeleton className="h-4 w-16 rounded-md" /></th>
                  <th className="px-4 py-3 text-left w-[20%]"><Skeleton className="h-4 w-16 rounded-md" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                        <Skeleton
                          className="h-4 rounded-md"
                          style={{ width: `${55 + ((i * 13) % 35)}%`, maxWidth: "180px" }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-28 rounded-md" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24 rounded-md" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24 rounded-md" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 divide-y rounded-xl border md:hidden overflow-hidden">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                    <Skeleton className="h-3 w-1/2 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
