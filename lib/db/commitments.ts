import { db } from "@/db"
import {
  commitment_ministries,
  commitment_offerings,
  members,
  ministries,
  offering_categories,
} from "@/db/schema"
import { asc, eq, inArray } from "drizzle-orm"

export type MinistryAssignment = {
  commitment_id: string
  ministry_id: string
  ministry_name: string
  parent_id: string | null
}

export type OfferingAssignment = {
  commitment_id: string
  offering_category_id: string
  offering_name: string
}

/** All members with the columns every commitment view needs, sorted by name. */
export function getMembersForCommitments() {
  return db.select({
    member_id: members.id,
    first_name: members.first_name,
    last_name: members.last_name,
    contact_number: members.contact_number,
  }).from(members).orderBy(asc(members.last_name), asc(members.first_name))
}

export async function getMinistryAssignments(commitmentIds: string[]): Promise<MinistryAssignment[]> {
  if (commitmentIds.length === 0) return []
  return db.select({
    commitment_id: commitment_ministries.commitment_id,
    ministry_id: commitment_ministries.ministry_id,
    ministry_name: ministries.name,
    parent_id: ministries.parent_id,
  })
    .from(commitment_ministries)
    .innerJoin(ministries, eq(commitment_ministries.ministry_id, ministries.id))
    .where(inArray(commitment_ministries.commitment_id, commitmentIds))
}

export async function getOfferingAssignments(commitmentIds: string[]): Promise<OfferingAssignment[]> {
  if (commitmentIds.length === 0) return []
  return db.select({
    commitment_id: commitment_offerings.commitment_id,
    offering_category_id: commitment_offerings.offering_category_id,
    offering_name: offering_categories.name,
  })
    .from(commitment_offerings)
    .innerJoin(offering_categories, eq(commitment_offerings.offering_category_id, offering_categories.id))
    .where(inArray(commitment_offerings.commitment_id, commitmentIds))
}

/** Replaces every ministry/offering link of a commitment with the given ids. */
export async function replaceCommitmentAssignments(
  commitmentId: string,
  ministryIds: string[],
  offeringCategoryIds: string[]
) {
  await db.delete(commitment_ministries).where(eq(commitment_ministries.commitment_id, commitmentId))
  if (ministryIds.length > 0) {
    await db.insert(commitment_ministries).values(
      ministryIds.map(ministry_id => ({ commitment_id: commitmentId, ministry_id }))
    )
  }

  await db.delete(commitment_offerings).where(eq(commitment_offerings.commitment_id, commitmentId))
  if (offeringCategoryIds.length > 0) {
    await db.insert(commitment_offerings).values(
      offeringCategoryIds.map(offering_category_id => ({ commitment_id: commitmentId, offering_category_id }))
    )
  }
}
