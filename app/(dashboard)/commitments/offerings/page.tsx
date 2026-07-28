import { getOfferingCategories } from "./actions"
import { getCommitmentsByYear } from "../actions"
import { OfferingsClient } from "./OfferingsClient"
import { Gift } from "lucide-react"

export const revalidate = 0

export const metadata = { title: "Offering Commitments | CBT Database" }

export default async function OfferingsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const currentYear = new Date().getFullYear()
  const resolvedSearchParams = await searchParams
  const year = resolvedSearchParams.year ? parseInt(resolvedSearchParams.year) : currentYear

  const [categories, allCommitments] = await Promise.all([
    getOfferingCategories(),
    getCommitmentsByYear(year),
  ])

  const memberPledges = allCommitments.map(c => ({
    member_id: c.member_id,
    first_name: c.first_name,
    last_name: c.last_name,
    contact_number: c.contact_number,
    offerings: c.offerings,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-full">
          <Gift className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Offering Commitments</h1>
          <p className="text-muted-foreground">View member offering commitments and configure offering categories.</p>
        </div>
      </div>
      <OfferingsClient categories={categories} memberPledges={memberPledges} year={year} />
    </div>
  )
}
