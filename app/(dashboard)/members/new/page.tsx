import { MemberForm } from "@/components/members/MemberForm"

export default function NewMemberPage() {
  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Add New Member</h1>
      <MemberForm />
    </div>
  )
}
