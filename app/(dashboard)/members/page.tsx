import { db } from "@/db"
import { members } from "@/db/schema"
import { asc } from "drizzle-orm"
import { columns } from "@/components/members/columns"
import { DataTable } from "@/components/members/data-table"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import Link from "next/link"

export const revalidate = 0 // Disable cache for this page to always show fresh members

export default async function MembersPage() {
  const membersList = await db.select({
    id: members.id,
    first_name: members.first_name,
    last_name: members.last_name,
    contact_number: members.contact_number,
    city: members.city,
    occupation: members.occupation,
    created_at: members.created_at
  }).from(members).orderBy(asc(members.last_name))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Members Directory</h1>
        <Button asChild>
          <Link href="/members/new"><UserPlus className="mr-2 h-4 w-4" /> Add Member</Link>
        </Button>
      </div>
      <DataTable columns={columns} data={membersList} />
    </div>
  )
}
