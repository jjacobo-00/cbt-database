import { db } from "@/db"
import { members, member_ministries, children } from "@/db/schema"
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

  // Fetch current enrolled ministries
  const currentMinistries = await db
    .select({ ministry_id: member_ministries.ministry_id })
    .from(member_ministries)
    .where(eq(member_ministries.member_id, resolvedParams.id))
  
  const ministryIds = currentMinistries.map(m => m.ministry_id)

  // Fetch current registered children
  const existingChildren = await db
    .select({
      id: children.id,
      name: children.name,
      birth_date: children.birth_date,
      child_member_id: children.child_member_id
    })
    .from(children)
    .where(eq(children.member_id, resolvedParams.id))

  const ministriesList = await getMinistries()
  const allMembers = await getMembersList()

  // Map database format back to form expected format
  const mappedMember = {
    ...member,
    gender: member.sex,
    address: member.street || member.house_number || "",
    ministries: ministryIds,
    children: existingChildren.map(c => ({
      id: c.id,
      name: c.name,
      birth_date: c.birth_date || "",
      child_member_id: c.child_member_id || "",
      is_cbt_member: !!c.child_member_id
    }))
  }

  return (
    <div className="py-6 max-w-5xl">
      <MemberForm initialData={mappedMember} ministries={ministriesList} allMembers={allMembers} />
    </div>
  )
}
