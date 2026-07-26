"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { commitments, commitment_ministries, commitment_offerings, members, ministries, offering_categories } from "@/db/schema"
import { eq, and, asc, desc, inArray } from "drizzle-orm"

export async function getCommitmentsByYear(year: number) {
  try {
    // Fetch ALL members in the directory
    const allMembers = await db.select({
      member_id: members.id,
      first_name: members.first_name,
      last_name: members.last_name,
      contact_number: members.contact_number,
    }).from(members).orderBy(asc(members.last_name), asc(members.first_name))

    if (allMembers.length === 0) return []

    // Fetch existing commitments for this specific year
    const yearComms = await db.select({
      id: commitments.id,
      member_id: commitments.member_id,
      year: commitments.year,
    }).from(commitments).where(eq(commitments.year, year))

    const commIds = yearComms.map(c => c.id)

    // Fetch ministry assignments if any commitments exist
    const ministryAssignments = commIds.length > 0
      ? await db.select({
          commitment_id: commitment_ministries.commitment_id,
          ministry_id: commitment_ministries.ministry_id,
          ministry_name: ministries.name,
          parent_id: ministries.parent_id,
        })
        .from(commitment_ministries)
        .innerJoin(ministries, eq(commitment_ministries.ministry_id, ministries.id))
        .where(inArray(commitment_ministries.commitment_id, commIds))
      : []

    // Fetch offering assignments if any commitments exist
    const offeringAssignments = commIds.length > 0
      ? await db.select({
          commitment_id: commitment_offerings.commitment_id,
          offering_category_id: commitment_offerings.offering_category_id,
          offering_name: offering_categories.name,
        })
        .from(commitment_offerings)
        .innerJoin(offering_categories, eq(commitment_offerings.offering_category_id, offering_categories.id))
        .where(inArray(commitment_offerings.commitment_id, commIds))
      : []

    // Combine all members with their commitment data (if present)
    return allMembers.map(m => {
      const comm = yearComms.find(c => c.member_id === m.member_id)
      const memberMins = comm ? ministryAssignments.filter(ma => ma.commitment_id === comm.id) : []
      const memberOffs = comm ? offeringAssignments.filter(oa => oa.commitment_id === comm.id) : []
      
      return {
        id: comm?.id || `temp-${m.member_id}`,
        member_id: m.member_id,
        year,
        first_name: m.first_name,
        last_name: m.last_name,
        contact_number: m.contact_number,
        has_pledged: !!comm && (memberMins.length > 0 || memberOffs.length > 0),
        ministries: memberMins,
        offerings: memberOffs,
      }
    })
  } catch (error) {
    console.error("Error fetching commitments by year:", error)
    return []
  }
}

export async function getRecommitmentTrackerData(targetYear: number) {
  try {
    const prevYear = targetYear - 1

    // Fetch ALL members
    const allMembers = await db.select({
      member_id: members.id,
      first_name: members.first_name,
      last_name: members.last_name,
      contact_number: members.contact_number,
    }).from(members).orderBy(asc(members.last_name), asc(members.first_name))

    if (allMembers.length === 0) return []

    // Fetch commitments for target year and prev year
    const allComms = await db.select({
      id: commitments.id,
      member_id: commitments.member_id,
      year: commitments.year,
    }).from(commitments)

    const commIds = allComms.map(c => c.id)

    const ministryAssignments = commIds.length > 0
      ? await db.select({
          commitment_id: commitment_ministries.commitment_id,
          ministry_id: commitment_ministries.ministry_id,
          ministry_name: ministries.name,
        })
        .from(commitment_ministries)
        .innerJoin(ministries, eq(commitment_ministries.ministry_id, ministries.id))
        .where(inArray(commitment_ministries.commitment_id, commIds))
      : []

    const offeringAssignments = commIds.length > 0
      ? await db.select({
          commitment_id: commitment_offerings.commitment_id,
          offering_category_id: commitment_offerings.offering_category_id,
          offering_name: offering_categories.name,
        })
        .from(commitment_offerings)
        .innerJoin(offering_categories, eq(commitment_offerings.offering_category_id, offering_categories.id))
        .where(inArray(commitment_offerings.commitment_id, commIds))
      : []

    return allMembers.map(m => {
      const targetComm = allComms.find(c => c.member_id === m.member_id && c.year === targetYear)
      const prevComm = allComms.find(c => c.member_id === m.member_id && c.year === prevYear)

      // Find latest active year if prevYear doesn't exist
      const memberComms = allComms.filter(c => c.member_id === m.member_id && c.year < targetYear)
      const latestPriorComm = memberComms.sort((a, b) => b.year - a.year)[0] || null

      const referenceComm = prevComm || latestPriorComm

      const targetMins = targetComm ? ministryAssignments.filter(ma => ma.commitment_id === targetComm.id) : []
      const targetOffs = targetComm ? offeringAssignments.filter(oa => oa.commitment_id === targetComm.id) : []

      const refMins = referenceComm ? ministryAssignments.filter(ma => ma.commitment_id === referenceComm.id) : []
      const refOffs = referenceComm ? offeringAssignments.filter(oa => oa.commitment_id === referenceComm.id) : []

      let status: "recommitted" | "pending" | "unassigned" = "unassigned"
      if (targetComm && (targetMins.length > 0 || targetOffs.length > 0)) {
        status = "recommitted"
      } else if (referenceComm && (refMins.length > 0 || refOffs.length > 0)) {
        status = "pending"
      }

      return {
        member_id: m.member_id,
        first_name: m.first_name,
        last_name: m.last_name,
        contact_number: m.contact_number,
        status,
        targetYear,
        referenceYear: referenceComm?.year || null,
        targetMinistries: targetMins,
        targetOfferings: targetOffs,
        referenceMinistries: refMins,
        referenceOfferings: refOffs,
      }
    })
  } catch (error) {
    console.error("Error fetching recommitment tracker data:", error)
    return []
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
    revalidatePath("/commitments/recommitment")
    revalidatePath("/commitments/offerings")
    return commitment
  } catch (error) {
    console.error("Error upserting commitment:", error)
    throw new Error("Failed to save commitment.")
  }
}

export async function getAvailableYears() {
  try {
    const years = await db.selectDistinct({ year: commitments.year }).from(commitments).orderBy(desc(commitments.year))
    const currentYear = new Date().getFullYear()
    const result = [...new Set([currentYear, ...years.map(y => y.year)])].sort((a, b) => b - a)
    return result
  } catch {
    return [new Date().getFullYear()]
  }
}
