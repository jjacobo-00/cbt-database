import { db } from "@/db"
import { members } from "@/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { MemberForm } from "@/components/members/MemberForm"
import { getMinistries } from "@/app/(dashboard)/ministries/actions"
import { getMembersList } from "@/app/(dashboard)/members/actions"

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const [member] = await db.select().from(members).where(eq(members.id, resolvedParams.id))

  if (!member) {
    notFound()
  }

  const ministriesList = await getMinistries()
  const allMembers = await getMembersList()

  // Map database format back to form expected format
  const mappedMember = {
    ...member,
    gender: member.sex,
    address: member.street || member.house_number || "",
  }

  return (
    <div className="py-6 max-w-5xl">
      <MemberForm initialData={mappedMember} ministries={ministriesList} allMembers={allMembers} />
    </div>
  )
}
