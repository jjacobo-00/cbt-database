"use server"

import { db } from "@/db"
import { missions } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { runActionResult, safeQuery } from "@/lib/utils/actions"

type MissionInput = {
  name: string
  location?: string
  pastor_name?: string
  established_date?: string
}

function toMissionValues(data: MissionInput) {
  return {
    name: data.name,
    location: data.location || null,
    pastor_name: data.pastor_name || null,
    established_date: data.established_date || null,
  }
}

export async function getMissions() {
  return safeQuery("fetching missions", () => db.select().from(missions).orderBy(missions.name), [])
}

export async function createMission(data: MissionInput) {
  return runActionResult("creating mission", "Failed to create mission", async () => {
    const [newMission] = await db.insert(missions).values(toMissionValues(data)).returning()
    revalidatePath("/missions")
    return newMission
  })
}

export async function updateMission(id: string, data: MissionInput) {
  return runActionResult("updating mission", "Failed to update mission", async () => {
    const [updatedMission] = await db.update(missions).set(toMissionValues(data)).where(eq(missions.id, id)).returning()
    revalidatePath("/missions")
    return updatedMission
  })
}

export async function deleteMission(id: string) {
  return runActionResult("deleting mission", "Failed to delete mission", async () => {
    await db.delete(missions).where(eq(missions.id, id))
    revalidatePath("/missions")
  })
}
