import { getCommitmentsByYear, getAvailableYears } from "./actions"
import { getMinistries } from "@/app/(dashboard)/ministries/actions"
import { getOfferingCategories } from "./offerings/actions"
import { CommitmentsClient } from "./CommitmentsClient"
import { HandHeart } from "lucide-react"

export const revalidate = 0

export const metadata = { title: "Commitments | CBT Directory" }

export default async function CommitmentsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const currentYear = new Date().getFullYear()
  const resolvedSearchParams = await searchParams
  const year = resolvedSearchParams.year ? parseInt(resolvedSearchParams.year) : currentYear

  const [commitmentsList, availableYears, allMinistries, allOfferings] = await Promise.all([
    getCommitmentsByYear(year),
    getAvailableYears(),
    getMinistries(),
    getOfferingCategories(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-full">
          <HandHeart className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commitments</h1>
          <p className="text-muted-foreground">Yearly ministry and offering commitments.</p>
        </div>
      </div>
      <CommitmentsClient
        commitments={commitmentsList}
        year={year}
        availableYears={availableYears}
        allMinistries={allMinistries.map(m => ({ id: m.id, name: m.name, parent_id: m.parent_id ?? null }))}
        allOfferings={allOfferings}
      />
    </div>
  )
}
