import { getInviteDetails } from "@/app/(dashboard)/members/actions"
import { InviteClient } from "@/components/members/InviteClient"
import { db } from "@/db"
import { ministries, offering_categories, members } from "@/db/schema"
import { asc } from "drizzle-orm"

export const revalidate = 0 // Disable cache

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  try {
    const resolvedParams = await params
    const token = resolvedParams?.token || ""

    if (!token) {
      return (
        <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center text-center">
          <h1 className="text-2xl font-bold text-destructive">Invalid Link</h1>
          <p className="text-muted-foreground mt-2 max-w-md">No registration token was provided. Please request a valid invitation link.</p>
        </div>
      )
    }

    const inviteDetails = await getInviteDetails(token)

    // Fetch and safely serialize database objects to prevent Server Component date serialization errors
    const rawMinistries = await db.select().from(ministries).orderBy(asc(ministries.name))
    const allMinistries = rawMinistries.map(m => ({
      ...m,
      created_at: m.created_at ? m.created_at.toISOString() : null
    }))

    const rawOfferings = await db.select().from(offering_categories).orderBy(asc(offering_categories.name))
    const allOfferings = rawOfferings.map(o => ({
      ...o,
      created_at: o.created_at ? o.created_at.toISOString() : null
    }))

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
  } catch (error) {
    console.error("Error loading invite page:", error)
    return (
      <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-destructive">Link Invalid or Expired</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          This registration link could not be loaded. It may be invalid, expired, or revoked. Please ask your church administrator for a new link.
        </p>
      </div>
    )
  }
}
