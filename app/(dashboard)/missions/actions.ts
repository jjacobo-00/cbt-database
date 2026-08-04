"use server"

import { db } from "@/db"
import { missions } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/utils/action-helpers"

export async function getMissions() {
  try {
    const data = await db.select().from(missions).orderBy(missions.name)
    return data
  } catch (error) {
    console.error("Error fetching missions:", error)
    return []
  }
}

export async function createMission(data: {
  name: string
  location?: string
  pastor_name?: string
  established_date?: string
}) {
  await requireAdmin()
  try {
    const newMission = await db.insert(missions).values({
      name: data.name,
      location: data.location || null,
      pastor_name: data.pastor_name || null,
      established_date: data.established_date || null,
    }).returning()
    
    revalidatePath("/missions")
    return { success: true, data: newMission[0] }
  } catch (error) {
    console.error("Error creating mission:", error)
    return { success: false, error: "Failed to create mission" }
  }
}

export async function updateMission(
  id: string,
  data: {
    name: string
    location?: string
    pastor_name?: string
    established_date?: string
  }
) {
  await requireAdmin()
  try {
    const updatedMission = await db.update(missions).set({
      name: data.name,
      location: data.location || null,
      pastor_name: data.pastor_name || null,
      established_date: data.established_date || null,
    }).where(eq(missions.id, id)).returning()
    
    revalidatePath("/missions")
    return { success: true, data: updatedMission[0] }
  } catch (error) {
    console.error("Error updating mission:", error)
    return { success: false, error: "Failed to update mission" }
  }
}

export async function deleteMission(id: string) {
  await requireAdmin()
  try {
    await db.delete(missions).where(eq(missions.id, id))
    revalidatePath("/missions")
    return { success: true }
  } catch (error) {
    console.error("Error deleting mission:", error)
    return { success: false, error: "Failed to delete mission" }
  }
}
