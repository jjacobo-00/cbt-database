import { getOfferingCategories } from "./actions"
import { OfferingsClient } from "./OfferingsClient"
import { Gift } from "lucide-react"

export const revalidate = 0

export const metadata = { title: "Offering Categories | CBT Directory" }

export default async function OfferingsPage() {
  const categories = await getOfferingCategories()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-full">
          <Gift className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Offering Categories</h1>
          <p className="text-muted-foreground">Manage the types of offerings members can commit to.</p>
        </div>
      </div>
      <OfferingsClient categories={categories} />
    </div>
  )
}
