import { getInviteDetails } from "@/app/(dashboard)/members/actions"
import { InviteClient } from "@/components/members/InviteClient"
import { db } from "@/db"
import { ministries, offering_categories, members } from "@/db/schema"
import { asc } from "drizzle-orm"

export const revalidate = 0 // Disable cache

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params
  const { token } = resolvedParams

  const inviteDetails = await getInviteDetails(token)

  // We need to pass down the list of ministries, offering categories, and basic members list for spouses
  // (Same as we do in the regular new member page)
  const allMinistries = await db.select().from(ministries).orderBy(asc(ministries.name))
  const allOfferings = await db.select().from(offering_categories).orderBy(asc(offering_categories.name))
  const allMembers = await db.select({
    id: members.id,
    first_name: members.first_name,
    last_name: members.last_name
  }).from(members).orderBy(asc(members.last_name))

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 flex items-center justify-center relative overflow-hidden">
      {/* Background glow similar to login page */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="z-10 w-full">
        <InviteClient 
          token={token} 
          inviteDetails={inviteDetails} 
          ministries={allMinistries}
          offeringCategories={allOfferings}
          allMembers={allMembers}
        />
      </div>
    </div>
  )
}
