import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function EditMemberLoading() {
  return (
    <div className="sm:bg-card rounded-xl sm:border sm:shadow-sm p-3.5 sm:p-6 md:p-10 w-full mx-auto max-w-7xl animate-in fade-in duration-300">
      {/* Form Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-56 rounded-xl" />
            <Skeleton className="h-4 w-44 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-11 w-36 rounded-xl" />
      </div>

      {/* Stepper Progress Bar Skeleton (8 Steps) */}
      <div className="py-4 border-b border-border mb-8 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-20 rounded-md hidden md:block" />
          </div>
        ))}
      </div>

      {/* 2-Column Wizard Layout Grid */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-2 border-b pb-3">
            <Skeleton className="h-6 w-48 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ))}
          </div>

          {/* Bottom Buttons Skeleton */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Skeleton className="h-11 w-24 rounded-xl" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-32 rounded-xl" />
              <Skeleton className="h-11 w-32 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Right Column: Live Profile Preview Panel Skeleton */}
        <div className="lg:col-span-4 hidden lg:block space-y-5">
          <Card className="rounded-2xl shadow-xs">
            <CardHeader className="border-b pb-3">
              <Skeleton className="h-5 w-40 rounded-lg" />
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-32 rounded-md" />
                  <Skeleton className="h-4 w-20 rounded-full" />
                </div>
              </div>
              <div className="space-y-2.5 pt-2 border-t">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-4/5 rounded-md" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-xs">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-36 rounded-md" />
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 6 }).map((_, k) => (
                <Skeleton key={k} className="h-8 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
