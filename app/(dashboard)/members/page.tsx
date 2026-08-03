import { db } from "@/db"
import { members, ministries, member_ministries } from "@/db/schema"
import { asc, eq } from "drizzle-orm"
import { columns } from "@/components/members/columns"
import { DataTable } from "@/components/members/data-table"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import Link from "next/link"
import { GenerateInviteLinkButton } from "@/components/members/GenerateInviteLinkButton"

export const revalidate = 0 // Disable cache for this page to always show fresh members

export default async function MembersPage() {
  const membersList = await db.select({
    id: members.id,
    first_name: members.first_name,
    last_name: members.last_name,
    middle_name: members.middle_name,
    suffix: members.suffix,
    church_role: members.church_role,
    contact_number: members.contact_number,
    email: members.email,
    city: members.city,
    occupation: members.occupation,
    position: members.position,
    company: members.company,
    employment_status: members.employment_status,
    gender: members.gender,
    sex: members.sex,
    birth_date: members.birth_date,
    age: members.age,
    marital_status: members.marital_status,
    highest_educational_attainment: members.highest_educational_attainment,
    blood_type: members.blood_type,
    allergies: members.allergies,
    membership_date: members.membership_date,
    date_saved: members.date_saved,
    date_baptized: members.date_baptized,
    created_at: members.created_at
  }).from(members).orderBy(asc(members.last_name))

  const memberMinistryRows = await db
    .select({
      member_id: member_ministries.member_id,
      ministry_name: ministries.name
    })
    .from(member_ministries)
    .innerJoin(ministries, eq(member_ministries.ministry_id, ministries.id))

  const ministriesList = await db.select({
    id: ministries.id,
    name: ministries.name
  }).from(ministries).orderBy(asc(ministries.name))

  // Map member ministries
  const ministryMap = new Map<string, string[]>()
  memberMinistryRows.forEach(row => {
    const existing = ministryMap.get(row.member_id) || []
    existing.push(row.ministry_name)
    ministryMap.set(row.member_id, existing)
  })

  const formattedMembers = membersList.map(member => ({
    ...member,
    church_role: member.church_role || "Member",
    occupation: member.occupation || member.position || (member.employment_status === "Student" ? "Student" : member.company ? `${member.position || "Employee"} at ${member.company}` : (member.employment_status && member.employment_status !== "None") ? member.employment_status : "-"),
    ministries: ministryMap.get(member.id) || [],
    created_at: member.created_at?.toISOString() || ""
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Members Directory</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <GenerateInviteLinkButton variant="secondary" className="flex-1 sm:flex-none" />
          <Button asChild className="flex-1 sm:flex-none">
            <Link href="/members/new"><UserPlus className="mr-2 h-4 w-4" /> Add Member</Link>
          </Button>
        </div>
      </div>
      <DataTable columns={columns} data={formattedMembers} ministriesList={ministriesList} />
    </div>
  )
}
