import { db } from "@/db"
import { 
  members, children, member_ministries, ministries, 
  commitments, commitment_ministries, commitment_offerings, offering_categories 
} from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { notFound } from "next/navigation"
import { MemberProfileView } from "@/components/members/MemberProfileView"

export const revalidate = 0

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const memberId = resolvedParams.id

  // 1. Fetch Member
  const [member] = await db.select().from(members).where(eq(members.id, memberId))

  if (!member) {
    notFound()
  }

  // 2. Fetch Children
  const childrenList = await db
    .select({
      id: children.id,
      name: children.name,
      birth_date: children.birth_date,
    })
    .from(children)
    .where(eq(children.member_id, memberId))

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

  // Fetch commitment details for each year
  const commitmentsHistory = await Promise.all(
    memberCommitmentRows.map(async (c) => {
      // Ministries
      const minRows = await db
        .select({ name: ministries.name })
        .from(commitment_ministries)
        .innerJoin(ministries, eq(commitment_ministries.ministry_id, ministries.id))
        .where(eq(commitment_ministries.commitment_id, c.id))

      // Offerings
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
    />
  )
}
