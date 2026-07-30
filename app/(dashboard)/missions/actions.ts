"use server"

import { db } from "@/db"
import { missions } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getMissions() {
  try {
    const data = await db.select().from(missions).orderBy(missions.name)
    return data
  } catch (error) {
    console.error("Error fetching missions:", error)
    throw new Error("Failed to load missions.", { cause: error })
  }
}

export async function createMission(data: {
  name: string
  location?: string
  pastor_name?: string
  established_date?: string
}) {
  try {
    const [newMission] = await db.insert(missions).values({
      name: data.name,
      location: data.location || null,
      pastor_name: data.pastor_name || null,
      established_date: data.established_date || null,
    }).returning()

    if (!newMission) {
      throw new Error("Insert returned no row")
    }

    revalidatePath("/missions")
    return { success: true as const, data: newMission }
  } catch (error) {
    console.error("Error creating mission:", error)
    return { success: false as const, error: "Failed to create mission" }
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
  try {
    const [updatedMission] = await db.update(missions).set({
      name: data.name,
      location: data.location || null,
      pastor_name: data.pastor_name || null,
      established_date: data.established_date || null,
    }).where(eq(missions.id, id)).returning()

    if (!updatedMission) {
      return { success: false as const, error: "Mission no longer exists" }
    }

    revalidatePath("/missions")
    return { success: true as const, data: updatedMission }
  } catch (error) {
    console.error("Error updating mission:", error)
    return { success: false as const, error: "Failed to update mission" }
  }
}

export async function deleteMission(id: string) {
  try {
    await db.delete(missions).where(eq(missions.id, id))
    revalidatePath("/missions")
    return { success: true as const }
  } catch (error) {
    console.error("Error deleting mission:", error)
    return { success: false as const, error: "Failed to delete mission" }
  }
}
