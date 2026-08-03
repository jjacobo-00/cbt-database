import { auth } from "@/auth"
import { db } from "@/db"
import { 
  members, children, member_ministries, ministries, 
  commitments, commitment_ministries, commitment_offerings, offering_categories 
} from "@/db/schema"
import { eq, desc, or } from "drizzle-orm"
import { redirect, notFound } from "next/navigation"
import { MemberProfileView } from "@/components/members/MemberProfileView"

export const revalidate = 0

export default async function MyProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // If user is an admin without a linked memberId, redirect them to dashboard
  if (session.user.role === "admin" && !session.user.memberId) {
    redirect("/dashboard")
  }

  const memberId = session.user.memberId

  if (!memberId) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-bold">Member Profile Not Found</h2>
        <p className="text-sm text-muted-foreground">
          Your account is logged in, but no linked member record was found. Please contact a church administrator to verify your registered email.
        </p>
      </div>
    )
  }

  // 1. Fetch Member Details
  const [member] = await db.select().from(members).where(eq(members.id, memberId))

  if (!member) {
    notFound()
  }

  // 2. Fetch Children
  const manualChildren = await db
    .select({
      id: children.id,
      name: children.name,
      birth_date: children.birth_date,
      child_member_id: children.child_member_id,
    })
    .from(children)
    .where(eq(children.member_id, memberId))

  const linkedMemberChildren = await db
    .select({
      id: members.id,
      name: members.first_name,
      last_name: members.last_name,
      birth_date: members.birth_date,
      child_member_id: members.id,
    })
    .from(members)
    .where(
      or(
        eq(members.father_member_id, memberId),
        eq(members.mother_member_id, memberId)
      )
    )

  const childrenMap = new Map<string, any>()
  manualChildren.forEach(c => {
    childrenMap.set(c.child_member_id || c.id, c)
  })
  linkedMemberChildren.forEach(c => {
    childrenMap.set(c.id, {
      id: c.id,
      name: `${c.name} ${c.last_name}`,
      birth_date: c.birth_date,
      child_member_id: c.id
    })
  })
  
  const childrenList = Array.from(childrenMap.values())

  // 3. Fetch Member's Active Enrolled Ministries
  const ministriesList = await db
    .select({
      id: ministries.id,
      name: ministries.name,
      description: ministries.description,
      for_everyone: ministries.for_everyone,
    })
    .from(member_ministries)
    .innerJoin(ministries, eq(member_ministries.ministry_id, ministries.id))
    .where(eq(member_ministries.member_id, memberId))

  // 4. Fetch Annual Commitments History
  const memberCommitmentRows = await db
    .select({
      id: commitments.id,
      year: commitments.year,
    })
    .from(commitments)
    .where(eq(commitments.member_id, memberId))
    .orderBy(desc(commitments.year))

  const commitmentsHistory = await Promise.all(
    memberCommitmentRows.map(async (c) => {
      const minRows = await db
        .select({ name: ministries.name })
        .from(commitment_ministries)
        .innerJoin(ministries, eq(commitment_ministries.ministry_id, ministries.id))
        .where(eq(commitment_ministries.commitment_id, c.id))

      const offRows = await db
        .select({ name: offering_categories.name })
        .from(commitment_offerings)
        .innerJoin(offering_categories, eq(commitment_offerings.offering_category_id, offering_categories.id))
        .where(eq(commitment_offerings.commitment_id, c.id))

      return {
        year: c.year,
        ministries: minRows.map(m => m.name),
        offerings: offRows.map(o => o.name),
      }
    })
  )

  return (
    <MemberProfileView
      member={member}
      childrenList={childrenList}
      ministriesList={ministriesList}
      commitmentsHistory={commitmentsHistory}
      isReadOnly={true}
    />
  )
}
