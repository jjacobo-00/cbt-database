"use server"

import { db } from "@/db"
import { ministries, members, member_ministries, commitments, commitment_ministries } from "@/db/schema"
import { eq, asc } from "drizzle-orm"
import { REVALIDATE_GROUPS, revalidatePaths, runAction, safeQuery } from "@/lib/utils/actions"
import { getCurrentYear } from "@/lib/utils/format"

const DUPLICATE_NAME_ERROR = "23505"

function duplicateNameMessage(error: unknown) {
  const code = (error as { code?: string } | null)?.code
  return code === DUPLICATE_NAME_ERROR ? "A ministry with that name already exists." : undefined
}

export async function getMinistries() {
  return safeQuery("fetching ministries", async () => {
    const data = await db.select({
      id: ministries.id,
      name: ministries.name,
      for_everyone: ministries.for_everyone,
      parent_id: ministries.parent_id,
      created_at: ministries.created_at,
    }).from(ministries).orderBy(asc(ministries.name))

    return data.map(m => ({ ...m, created_at: m.created_at?.toISOString() || "" }))
  }, [])
}

export async function createMinistry(name: string, forEveryone: boolean, parentId?: string | null) {
  await runAction("creating ministry", "Failed to create ministry.", async () => {
    const [inserted] = await db.insert(ministries).values({
      name: name.trim(),
      for_everyone: forEveryone,
      parent_id: parentId || null,
    }).returning()

    // If marked "For Everyone", auto-enroll all existing members & commitments
    if (forEveryone && inserted) {
      await autoEnrollAllMembersInMinistry(inserted.id)
    }
  }, duplicateNameMessage)
  revalidatePaths(REVALIDATE_GROUPS.ministries)
}

export async function updateMinistry(id: string, name: string, forEveryone?: boolean) {
  await runAction("updating ministry", "Failed to update ministry.", async () => {
    await db.update(ministries).set({
      name: name.trim(),
      ...(forEveryone !== undefined && { for_everyone: forEveryone }),
    }).where(eq(ministries.id, id))

    if (forEveryone) {
      await autoEnrollAllMembersInMinistry(id)
    }
  }, duplicateNameMessage)
  revalidatePaths(REVALIDATE_GROUPS.ministries)
}

export async function deleteMinistry(id: string) {
  await runAction("deleting ministry", "Failed to delete ministry.", async () => {
    await db.delete(ministries).where(eq(ministries.parent_id, id))
    await db.delete(ministries).where(eq(ministries.id, id))
  })
  revalidatePaths(REVALIDATE_GROUPS.ministries)
}

async function autoEnrollAllMembersInMinistry(ministryId: string) {
  await safeQuery("in autoEnrollAllMembersInMinistry", async () => {
    const allMembers = await db.select({ id: members.id }).from(members)
    if (allMembers.length === 0) return

    // 1. Enroll into member_ministries
    await db.insert(member_ministries).values(
      allMembers.map(m => ({ member_id: m.id, ministry_id: ministryId }))
    ).onConflictDoNothing()

    // 2. Enroll into current year commitments
    const yearComms = await db.select({ id: commitments.id }).from(commitments).where(eq(commitments.year, getCurrentYear()))
    if (yearComms.length > 0) {
      await db.insert(commitment_ministries).values(
        yearComms.map(c => ({ commitment_id: c.id, ministry_id: ministryId }))
      ).onConflictDoNothing()
    }
  }, undefined)
}
