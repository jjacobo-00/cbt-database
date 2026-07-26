import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="rounded-md border p-6 space-y-6 bg-card">
        {/* Toolbar simulation */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-[250px]" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-9 w-[100px]" />
            <Skeleton className="h-9 w-[100px]" />
          </div>
        </div>

        {/* Table simulation */}
        <div className="rounded-md border">
          <div className="border-b px-4 py-3 flex space-x-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-6 w-1/4" />
          </div>
          <div className="divide-y">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-4 py-4 flex space-x-4 items-center">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-8 w-8 ml-auto rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
