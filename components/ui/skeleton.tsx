import React from "react"
import { cn } from "@/lib/utils/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-lg bg-muted/60 relative overflow-hidden",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }

