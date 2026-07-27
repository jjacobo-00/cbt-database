import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export function TableSkeleton() {
  return (
    <div className="w-full">
      {/* Desktop Table Skeleton */}
      <div className="hidden md:block rounded-xl border bg-card shadow-sm overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-4 text-left"><Skeleton className="h-4 w-24" /></th>
                <th className="px-4 py-4 text-left"><Skeleton className="h-4 w-32" /></th>
                <th className="px-4 py-4 text-left"><Skeleton className="h-4 w-20" /></th>
                <th className="px-4 py-4 text-left"><Skeleton className="h-4 w-28" /></th>
                <th className="px-4 py-4 text-right flex justify-end"><Skeleton className="h-4 w-16" /></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-4 flex justify-end"><Skeleton className="h-8 w-24 rounded-md" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Skeleton */}
      <div className="grid grid-cols-1 gap-4 md:hidden mt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card shadow-sm p-4 space-y-4">
            <div className="border-b pb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 w-full">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            
            <div className="pt-4 border-t flex justify-end">
              <Skeleton className="h-9 w-full sm:w-32 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
