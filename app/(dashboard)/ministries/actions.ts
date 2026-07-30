"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { ministries, members, member_ministries, commitments, commitment_ministries } from "@/db/schema"
import { eq, asc } from "drizzle-orm"

export async function getMinistries() {
  try {
    const data = await db.select({
      id: ministries.id,
      name: ministries.name,
      for_everyone: ministries.for_everyone,
      parent_id: ministries.parent_id,
      created_at: ministries.created_at,
    }).from(ministries).orderBy(asc(ministries.name))
    
    return data.map(m => ({ ...m, created_at: m.created_at?.toISOString() || "" }))
  } catch (error) {
    console.error("Error fetching ministries:", error)
    throw new Error("Failed to load ministries.", { cause: error })
  }
}

export async function createMinistry(name: string, forEveryone: boolean, parentId?: string | null) {
  try {
    const [inserted] = await db.insert(ministries).values({
      name: name.trim(),
      for_everyone: forEveryone,
      parent_id: parentId || null,
    }).returning()

    if (!inserted) {
      throw new Error("Failed to create ministry: the database returned no row.")
    }

    // If marked "For Everyone", auto-enroll all existing members & commitments
    if (forEveryone) {
      await autoEnrollAllMembersInMinistry(inserted.id)
    }
  } catch (error) {
    if (isUniqueViolation(error)) throw new Error("A ministry with that name already exists.")
    console.error("Error creating ministry:", error)
    throw new Error("Failed to create ministry.", { cause: error })
  }
  revalidatePath("/ministries")
  revalidatePath("/members/new")
  revalidatePath("/commitments")
}

export async function updateMinistry(id: string, name: string, forEveryone?: boolean) {
  try {
    await db.update(ministries).set({
      name: name.trim(),
      ...(forEveryone !== undefined && { for_everyone: forEveryone }),
    }).where(eq(ministries.id, id))

    if (forEveryone) {
      await autoEnrollAllMembersInMinistry(id)
    }
  } catch (error) {
    if (isUniqueViolation(error)) throw new Error("A ministry with that name already exists.")
    console.error("Error updating ministry:", error)
    throw new Error("Failed to update ministry.", { cause: error })
  }
  revalidatePath("/ministries")
  revalidatePath("/members/new")
  revalidatePath("/commitments")
}

export async function deleteMinistry(id: string) {
  try {
    await db.delete(ministries).where(eq(ministries.parent_id, id))
    await db.delete(ministries).where(eq(ministries.id, id))
  } catch (error) {
    console.error("Error deleting ministry:", error)
    throw new Error("Failed to delete ministry.", { cause: error })
  }
  revalidatePath("/ministries")
  revalidatePath("/members/new")
  revalidatePath("/commitments")
}

// Postgres unique_violation
function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505"
}

async function autoEnrollAllMembersInMinistry(ministryId: string) {
  const allMembers = await db.select({ id: members.id }).from(members)
  if (allMembers.length === 0) return

  // 1. Enroll into member_ministries
  await db.insert(member_ministries).values(
    allMembers.map(m => ({ member_id: m.id, ministry_id: ministryId }))
  ).onConflictDoNothing()

  // 2. Enroll into current year commitments
  const currentYear = new Date().getFullYear()
  const yearComms = await db.select({ id: commitments.id }).from(commitments).where(eq(commitments.year, currentYear))
  if (yearComms.length > 0) {
    await db.insert(commitment_ministries).values(
      yearComms.map(c => ({ commitment_id: c.id, ministry_id: ministryId }))
    ).onConflictDoNothing()
  }
}
