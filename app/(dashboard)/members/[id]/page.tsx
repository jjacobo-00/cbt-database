import { db } from "@/db"
import { 
  members, children, member_ministries, ministries, 
  commitments, commitment_ministries, commitment_offerings, offering_categories, missions 
} from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { notFound } from "next/navigation"
import { MemberProfileView } from "@/components/members/MemberProfileView"

export const revalidate = 0

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const memberId = resolvedParams.id

  // 1. Fetch Member with Mission details
  const [memberResult] = await db
    .select({
      member: members,
      mission_name: missions.name,
      mission_location: missions.location,
      mission_pastor_name: missions.pastor_name,
    })
    .from(members)
    .leftJoin(missions, eq(members.mission_id, missions.id))
    .where(eq(members.id, memberId))

  if (!memberResult || !memberResult.member) {
    notFound()
  }

  let fetchedMissionName = memberResult.mission_name || null
  if (!fetchedMissionName && memberResult.member.church_role === "Mission Pastor") {
    const { ilike } = await import("drizzle-orm")
    const [matchingMission] = await db
      .select({ name: missions.name })
      .from(missions)
      .where(ilike(missions.pastor_name, `%${memberResult.member.last_name}%`))
    if (matchingMission) {
      fetchedMissionName = matchingMission.name
    }
  }

  const member = {
    ...memberResult.member,
    mission_name: fetchedMissionName,
    mission_location: memberResult.mission_location || null,
    mission_pastor_name: memberResult.mission_pastor_name || null,
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

  const { or } = await import('drizzle-orm')
  const linkedMemberChildren = await db
    .select({
      id: members.id, // Using member.id as the child row ID
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

  // Merge lists, preventing duplicates if a child is both manually added and linked
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

  // 3b. Fetch Ministries Led by this Member
  const ledMinistriesRows = await db
    .select({ name: ministries.name })
    .from(ministries)
    .where(eq(ministries.leader_id, memberId))

  const ledMinistries = ledMinistriesRows.map(m => m.name)

  return (
    <MemberProfileView
      member={member}
      childrenList={childrenList}
      ministriesList={ministriesList}
      commitmentsHistory={commitmentsHistory}
      ledMinistries={ledMinistries}
    />
  )
}
