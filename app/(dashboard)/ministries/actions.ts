"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { ministries } from "@/db/schema"
import { eq, asc } from "drizzle-orm"

export async function getMinistries() {
  try {
    const data = await db.select({
      id: ministries.id,
      name: ministries.name,
      created_at: ministries.created_at,
    }).from(ministries).orderBy(asc(ministries.name))
    
    // We stringify dates so Client Components don't complain about Date objects
    return data.map(m => ({ ...m, created_at: m.created_at?.toISOString() || "" }))
  } catch (error) {
    console.error("Error fetching ministries:", error)
    return []
  }
}

export async function createMinistry(name: string) {
  try {
    await db.insert(ministries).values({ name: name.trim() })
  } catch (error: any) {
    if (error.code === "23505") throw new Error("A ministry with that name already exists.")
    console.error("Error creating ministry:", error)
    throw new Error("Failed to create ministry.")
  }
  revalidatePath("/ministries")
}

export async function deleteMinistry(id: string) {
  try {
    await db.delete(ministries).where(eq(ministries.id, id))
  } catch (error) {
    console.error("Error deleting ministry:", error)
    throw new Error("Failed to delete ministry.")
  }
  revalidatePath("/ministries")
}
