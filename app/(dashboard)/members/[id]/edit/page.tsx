import { db } from "@/db"
import { members } from "@/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { MemberForm } from "@/components/members/MemberForm"
import { getMinistries } from "@/app/(dashboard)/ministries/actions"

export default async function EditMemberPage({ params }: { params: { id: string } }) {
  const [member] = await db.select().from(members).where(eq(members.id, params.id))

  if (!member) {
    notFound()
  }

  const ministriesList = await getMinistries()

  // Map database format back to form expected format
  const mappedMember = {
    ...member,
    gender: member.sex,
    address: member.street || member.house_number || "",
  }

  return (
    <div className="max-w-6xl mx-auto py-6">
      <MemberForm initialData={mappedMember} ministries={ministriesList} />
    </div>
  )
}
