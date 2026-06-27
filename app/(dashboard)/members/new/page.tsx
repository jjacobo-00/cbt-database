import { MemberForm } from "@/components/members/MemberForm"
import { getMinistries } from "@/app/(dashboard)/ministries/actions"

export default async function NewMemberPage() {
  const ministries = await getMinistries()

  return (
    <div className="max-w-6xl mx-auto py-6">
      <MemberForm ministries={ministries} />
    </div>
  )
}
