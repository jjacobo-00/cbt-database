import { MemberForm } from "@/components/members/MemberForm"
import { getMinistries } from "@/app/(dashboard)/ministries/actions"
import { getOfferingCategories } from "@/app/(dashboard)/commitments/offerings/actions"
import { getMembersList } from "@/app/(dashboard)/members/actions"
import { getMissions } from "@/app/(dashboard)/missions/actions"

export const revalidate = 0

export default async function NewMemberPage() {
  const [ministries, offeringCategories, allMembers, missions] = await Promise.all([
    getMinistries(),
    getOfferingCategories(),
    getMembersList(),
    getMissions(),
  ])

  return (
    <div className="w-full max-w-7xl mx-auto py-4 sm:py-6 px-2 sm:px-4">
      <MemberForm
        ministries={ministries}
        offeringCategories={offeringCategories}
        allMembers={allMembers}
        missions={missions}
      />
    </div>
  )
}
