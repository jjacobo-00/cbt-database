import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export function TableSkeleton({
  rows = 6,
  showToolbar = true,
  columnsCount = 5,
}: {
  rows?: number
  showToolbar?: boolean
  columnsCount?: number
}) {
  return (
    <div className="w-full space-y-4">
      {/* Search & Filter Toolbar Skeleton */}
      {showToolbar && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Skeleton className="h-11 w-full max-w-md rounded-xl" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-11 w-28 rounded-xl" />
            <Skeleton className="h-11 w-28 rounded-xl" />
          </div>
        </div>
      )}

      {/* Quick Filter Presets Strip Skeleton */}
      {showToolbar && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <Skeleton className="h-8 w-32 rounded-full shrink-0" />
          <Skeleton className="h-8 w-40 rounded-full shrink-0" />
          <Skeleton className="h-8 w-36 rounded-full shrink-0" />
          <Skeleton className="h-8 w-32 rounded-full shrink-0" />
        </div>
      )}

      {/* Desktop Table Skeleton */}
      <div className="hidden md:block rounded-2xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="px-4 py-3.5 text-left"><Skeleton className="h-4 w-32" /></th>
                <th className="px-4 py-3.5 text-left"><Skeleton className="h-4 w-28" /></th>
                <th className="px-4 py-3.5 text-left"><Skeleton className="h-4 w-24" /></th>
                <th className="px-4 py-3.5 text-left"><Skeleton className="h-4 w-24" /></th>
                <th className="px-4 py-3.5 text-right"><Skeleton className="h-4 w-16 ml-auto" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                      <div className="space-y-1.5 min-w-0">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Skeleton (Compact List Tiles) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {Array.from({ length: Math.min(rows, 5) }).map((_, i) => (
          <div key={i} className="rounded-2xl border bg-card shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                <div className="space-y-1.5 min-w-0 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3 w-16 rounded-md" />
                    <Skeleton className="h-3 w-20 rounded-md" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Footer Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 border-t">
        <Skeleton className="h-4 w-44" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

