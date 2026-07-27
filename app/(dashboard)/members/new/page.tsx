import { MemberForm } from "@/components/members/MemberForm"
import { getMinistries } from "@/app/(dashboard)/ministries/actions"
import { getOfferingCategories } from "@/app/(dashboard)/commitments/offerings/actions"
import { getMembersList } from "@/app/(dashboard)/members/actions"

export const revalidate = 0

export default async function NewMemberPage() {
  const [ministries, offeringCategories, allMembers] = await Promise.all([
    getMinistries(),
    getOfferingCategories(),
    getMembersList(),
  ])

  return (
    <div className="py-6 max-w-5xl">
      <MemberForm ministries={ministries} offeringCategories={offeringCategories} allMembers={allMembers} />
    </div>
  )
}
