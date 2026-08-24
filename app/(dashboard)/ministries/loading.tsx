import React from "react"
import { ChurchIcon, Users, ChevronDown, Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function MinistriesLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <ChurchIcon className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-8 w-44 rounded-xl" />
          <Skeleton className="h-4 w-72 sm:w-96 max-w-full rounded-md" />
        </div>
      </div>

      {/* Create New Top-Level Ministry Form Card Skeleton */}
      <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <ChurchIcon className="h-5 w-5 text-primary/40" />
          <Skeleton className="h-5 w-56 rounded-md" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 w-full sm:w-60 rounded-xl" />
          <Skeleton className="h-11 w-full sm:w-36 rounded-xl" />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
      </div>

      {/* List of Ministries Tree Skeleton */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary/40" />
            <Skeleton className="h-5 w-40 rounded-md" />
          </div>
        </div>

        <ul className="divide-y divide-border/60">
          {Array.from({ length: 6 }).map((_, i) => {
            const isChild = i % 3 === 2
            return (
              <li
                key={i}
                className={`p-3 sm:px-6 py-3.5 flex items-center justify-between gap-3 ${
                  isChild ? "pl-8 sm:pl-14 bg-muted/10" : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {!isChild && <ChevronDown className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
                  {isChild && <div className="w-4 h-4 shrink-0" />}
                  <Skeleton
                    className="h-4 rounded-md"
                    style={{ width: `${40 + ((i * 13) % 35)}%`, maxWidth: "200px" }}
                  />
                  {i % 2 === 0 ? (
                    <Skeleton className="h-5 w-24 rounded-full shrink-0" />
                  ) : (
                    <Skeleton className="h-5 w-36 rounded-full shrink-0" />
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!isChild && <Skeleton className="h-8 w-28 rounded-lg hidden sm:block" />}
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
