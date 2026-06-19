import { createClient } from "@/lib/supabase/server"
import { columns } from "@/components/members/columns"
import { DataTable } from "@/components/members/data-table"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import Link from "next/link"

export const revalidate = 0 // Disable cache for this page to always show fresh members

export default async function MembersPage() {
  const supabase = await createClient()

  const { data: members, error } = await supabase
    .from("members")
    .select("id, first_name, last_name, contact_number, city, occupation, created_at")
    .order("last_name", { ascending: true })

  if (error) {
    console.error("Error fetching members:", error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Members Directory</h1>
        <Button asChild>
          <Link href="/members/new"><UserPlus className="mr-2 h-4 w-4" /> Add Member</Link>
        </Button>
      </div>
      <DataTable columns={columns} data={members || []} />
    </div>
  )
}
