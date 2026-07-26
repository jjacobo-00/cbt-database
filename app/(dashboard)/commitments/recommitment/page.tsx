import { getRecommitmentTrackerData, getAvailableYears } from "../actions"
import { getMinistries } from "@/app/(dashboard)/ministries/actions"
import { getOfferingCategories } from "../offerings/actions"
import { RecommitmentClient } from "./RecommitmentClient"
import { RefreshCw } from "lucide-react"

export const revalidate = 0

export const metadata = { title: "Recommitment Tracker | CBT Directory" }

export default async function RecommitmentPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const currentYear = new Date().getFullYear()
  const resolvedSearchParams = await searchParams
  const year = resolvedSearchParams.year ? parseInt(resolvedSearchParams.year) : currentYear

  const [trackerData, availableYears, allMinistries, allOfferings] = await Promise.all([
    getRecommitmentTrackerData(year),
    getAvailableYears(),
    getMinistries(),
    getOfferingCategories(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-full">
          <RefreshCw className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recommitment Tracker</h1>
          <p className="text-muted-foreground">Review and map member ministry & offering recommitments for {year}.</p>
        </div>
      </div>
      <RecommitmentClient
        data={trackerData}
        targetYear={year}
        availableYears={availableYears}
        allMinistries={allMinistries.map(m => ({ id: m.id, name: m.name, parent_id: m.parent_id ?? null }))}
        allOfferings={allOfferings}
      />
    </div>
  )
}
