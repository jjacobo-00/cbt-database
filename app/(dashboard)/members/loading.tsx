import React from "react"
import { Users } from "lucide-react"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { Button } from "@/components/ui/button"

export default function MembersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Members Directory</h1>
            <p className="text-muted-foreground text-sm">Loading member database...</p>
          </div>
        </div>
        <Button disabled>Add New Member</Button>
      </div>
      <TableSkeleton />
    </div>
  )
}
