"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { commitments, commitment_ministries, commitment_offerings, members, ministries, offering_categories } from "@/db/schema"
import { eq, and, asc, desc, sql, inArray } from "drizzle-orm"

export async function getCommitmentsByYear(year: number) {
  try {
    // Get all commitments for the year
    const comms = await db.select({
      id: commitments.id,
      member_id: commitments.member_id,
      year: commitments.year,
      first_name: members.first_name,
      last_name: members.last_name,
      contact_number: members.contact_number,
    })
      .from(commitments)
      .innerJoin(members, eq(commitments.member_id, members.id))
      .where(eq(commitments.year, year))
      .orderBy(asc(members.last_name), asc(members.first_name))

    if (comms.length === 0) return []

    // Get all ministry assignments for these commitments
    const commIds = comms.map(c => c.id)
    const ministryAssignments = await db.select({
      commitment_id: commitment_ministries.commitment_id,
      ministry_id: commitment_ministries.ministry_id,
      ministry_name: ministries.name,
      parent_id: ministries.parent_id,
    })
      .from(commitment_ministries)
      .innerJoin(ministries, eq(commitment_ministries.ministry_id, ministries.id))
      .where(inArray(commitment_ministries.commitment_id, commIds))

    // Get all offering assignments
    const offeringAssignments = await db.select({
      commitment_id: commitment_offerings.commitment_id,
      offering_category_id: commitment_offerings.offering_category_id,
      offering_name: offering_categories.name,
    })
      .from(commitment_offerings)
      .innerJoin(offering_categories, eq(commitment_offerings.offering_category_id, offering_categories.id))
      .where(inArray(commitment_offerings.commitment_id, commIds))

    // Merge
    return comms.map(c => ({
      ...c,
      ministries: ministryAssignments.filter(m => m.commitment_id === c.id),
      offerings: offeringAssignments.filter(o => o.commitment_id === c.id),
    }))
  } catch (error) {
    console.error("Error fetching commitments:", error)
    return []
  }
}

export async function getCommitmentForMember(memberId: string, year: number) {
  try {
    const [commitment] = await db.select().from(commitments)
      .where(and(eq(commitments.member_id, memberId), eq(commitments.year, year)))

    if (!commitment) return null

    const mins = await db.select({ ministry_id: commitment_ministries.ministry_id })
      .from(commitment_ministries).where(eq(commitment_ministries.commitment_id, commitment.id))

    const offs = await db.select({ offering_category_id: commitment_offerings.offering_category_id })
      .from(commitment_offerings).where(eq(commitment_offerings.commitment_id, commitment.id))

    return {
      ...commitment,
      ministry_ids: mins.map(m => m.ministry_id),
      offering_ids: offs.map(o => o.offering_category_id),
    }
  } catch (error) {
    console.error("Error fetching member commitment:", error)
    return null
  }
}

export async function upsertCommitment(memberId: string, year: number, ministryIds: string[], offeringCategoryIds: string[]) {
  try {
    // Upsert commitment record
    let [commitment] = await db.select().from(commitments)
      .where(and(eq(commitments.member_id, memberId), eq(commitments.year, year)))

    if (!commitment) {
      [commitment] = await db.insert(commitments).values({ member_id: memberId, year }).returning()
    }

    // Replace ministries: delete old, insert new
    await db.delete(commitment_ministries).where(eq(commitment_ministries.commitment_id, commitment.id))
    if (ministryIds.length > 0) {
      await db.insert(commitment_ministries).values(
        ministryIds.map(mid => ({ commitment_id: commitment.id, ministry_id: mid }))
      )
    }

    // Replace offerings: delete old, insert new
    await db.delete(commitment_offerings).where(eq(commitment_offerings.commitment_id, commitment.id))
    if (offeringCategoryIds.length > 0) {
      await db.insert(commitment_offerings).values(
        offeringCategoryIds.map(oid => ({ commitment_id: commitment.id, offering_category_id: oid }))
      )
    }

    revalidatePath("/commitments")
    return commitment
  } catch (error) {
    console.error("Error upserting commitment:", error)
    throw new Error("Failed to save commitment.")
  }
}

export async function startRecommitment(fromYear: number, toYear: number) {
  try {
    // Get all commitments from the source year
    const sourceComms = await db.select().from(commitments).where(eq(commitments.year, fromYear))

    for (const src of sourceComms) {
      // Check if commitment already exists for this member in the target year
      const [existing] = await db.select().from(commitments)
        .where(and(eq(commitments.member_id, src.member_id), eq(commitments.year, toYear)))

      if (existing) continue // Skip if already committed for target year

      // Create new commitment
      const [newComm] = await db.insert(commitments).values({
        member_id: src.member_id,
        year: toYear,
      }).returning()

      // Copy ministries
      const mins = await db.select().from(commitment_ministries).where(eq(commitment_ministries.commitment_id, src.id))
      if (mins.length > 0) {
        await db.insert(commitment_ministries).values(
          mins.map(m => ({ commitment_id: newComm.id, ministry_id: m.ministry_id }))
        )
      }

      // Copy offerings
      const offs = await db.select().from(commitment_offerings).where(eq(commitment_offerings.commitment_id, src.id))
      if (offs.length > 0) {
        await db.insert(commitment_offerings).values(
          offs.map(o => ({ commitment_id: newComm.id, offering_category_id: o.offering_category_id }))
        )
      }
    }

    revalidatePath("/commitments")
    return { copied: sourceComms.length }
  } catch (error) {
    console.error("Error starting recommitment:", error)
    throw new Error("Failed to start recommitment.")
  }
}

export async function getAvailableYears() {
  try {
    const years = await db.selectDistinct({ year: commitments.year }).from(commitments).orderBy(desc(commitments.year))
    return years.map(y => y.year)
  } catch {
    return []
  }
}
