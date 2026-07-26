"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { ministries } from "@/db/schema"
import { eq, asc, isNull } from "drizzle-orm"

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
    return []
  }
}

export async function createMinistry(name: string, forEveryone: boolean, parentId?: string | null) {
  try {
    await db.insert(ministries).values({
      name: name.trim(),
      for_everyone: forEveryone,
      parent_id: parentId || null,
    })
  } catch (error: any) {
    if (error.code === "23505") throw new Error("A ministry with that name already exists.")
    console.error("Error creating ministry:", error)
    throw new Error("Failed to create ministry.")
  }
  revalidatePath("/ministries")
  revalidatePath("/members/new")
}

export async function updateMinistry(id: string, name: string, forEveryone?: boolean) {
  try {
    await db.update(ministries).set({
      name: name.trim(),
      ...(forEveryone !== undefined && { for_everyone: forEveryone }),
    }).where(eq(ministries.id, id))
  } catch (error: any) {
    if (error.code === "23505") throw new Error("A ministry with that name already exists.")
    console.error("Error updating ministry:", error)
    throw new Error("Failed to update ministry.")
  }
  revalidatePath("/ministries")
  revalidatePath("/members/new")
}

export async function deleteMinistry(id: string) {
  try {
    // Delete children first, then the parent
    await db.delete(ministries).where(eq(ministries.parent_id, id))
    await db.delete(ministries).where(eq(ministries.id, id))
  } catch (error) {
    console.error("Error deleting ministry:", error)
    throw new Error("Failed to delete ministry.")
  }
  revalidatePath("/ministries")
  revalidatePath("/members/new")
}
