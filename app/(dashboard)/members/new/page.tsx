import { MemberForm } from "@/components/members/MemberForm"
import { getMinistries } from "@/app/(dashboard)/ministries/actions"
import { getOfferingCategories } from "@/app/(dashboard)/commitments/offerings/actions"

export const revalidate = 0

export default async function NewMemberPage() {
  const [ministries, offeringCategories] = await Promise.all([
    getMinistries(),
    getOfferingCategories(),
  ])

  return (
    <div className="max-w-6xl mx-auto py-6">
      <MemberForm ministries={ministries} offeringCategories={offeringCategories} />
    </div>
  )
}
