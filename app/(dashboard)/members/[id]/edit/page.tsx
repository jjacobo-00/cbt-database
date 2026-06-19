import { MemberForm } from "@/components/members/MemberForm"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

export default async function EditMemberPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: member, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error || !member) {
    notFound()
  }

  return (
    <div className="max-w-6xl mx-auto py-6">
      <MemberForm initialData={member} />
    </div>
  )
}
