"use server"

import { db } from "@/db"
import { commitments } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"
import {
  getMembersForCommitments,
  getMinistryAssignments,
  getOfferingAssignments,
  replaceCommitmentAssignments,
} from "@/lib/db/commitments"
import { REVALIDATE_GROUPS, revalidatePaths, runAction, safeQuery } from "@/lib/utils/actions"
import { getCurrentYear } from "@/lib/utils/format"

export async function getCommitmentsByYear(year: number) {
  return safeQuery("fetching commitments by year", async () => {
    // Fetch ALL members in the directory
    const allMembers = await getMembersForCommitments()
    if (allMembers.length === 0) return []

    // Fetch existing commitments for this specific year
    const yearComms = await db.select({
      id: commitments.id,
      member_id: commitments.member_id,
      year: commitments.year,
    }).from(commitments).where(eq(commitments.year, year))

    const commIds = yearComms.map(c => c.id)
    const ministryAssignments = await getMinistryAssignments(commIds)
    const offeringAssignments = await getOfferingAssignments(commIds)

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
  }, [])
}

export async function getRecommitmentTrackerData(targetYear: number) {
  return safeQuery("fetching recommitment tracker data", async () => {
    const prevYear = targetYear - 1

    // Fetch ALL members
    const allMembers = await getMembersForCommitments()
    if (allMembers.length === 0) return []

    // Fetch commitments for target year and prev year
    const allComms = await db.select({
      id: commitments.id,
      member_id: commitments.member_id,
      year: commitments.year,
    }).from(commitments)

    const commIds = allComms.map(c => c.id)
    const ministryAssignments = await getMinistryAssignments(commIds)
    const offeringAssignments = await getOfferingAssignments(commIds)

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
  }, [])
}

export async function upsertCommitment(memberId: string, year: number, ministryIds: string[], offeringCategoryIds: string[]) {
  const commitment = await runAction("upserting commitment", "Failed to save commitment.", async () => {
    let [existing] = await db.select().from(commitments)
      .where(and(eq(commitments.member_id, memberId), eq(commitments.year, year)))

    if (!existing) {
      [existing] = await db.insert(commitments).values({ member_id: memberId, year }).returning()
    }

    await replaceCommitmentAssignments(existing.id, ministryIds, offeringCategoryIds)
    return existing
  })

  revalidatePaths(REVALIDATE_GROUPS.commitments)
  return commitment
}

export async function getAvailableYears() {
  return safeQuery("fetching available commitment years", async () => {
    const years = await db.selectDistinct({ year: commitments.year }).from(commitments).orderBy(desc(commitments.year))
    return [...new Set([getCurrentYear(), ...years.map(y => y.year)])].sort((a, b) => b - a)
  }, [getCurrentYear()])
}
