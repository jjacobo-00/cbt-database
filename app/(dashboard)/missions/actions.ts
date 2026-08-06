"use server"

import { db } from "@/db"
import { missions, members } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/utils/action-helpers"

export async function getMissions() {
  try {
    const pastorMember = alias(members, "pastor_member")
    const data = await db
      .select({
        id: missions.id,
        name: missions.name,
        location: missions.location,
        pastor_id: missions.pastor_id,
        pastor_name: sql<string | null>`COALESCE(NULLIF(TRIM(CONCAT(${pastorMember.first_name}, ' ', ${pastorMember.last_name})), ''), ${missions.pastor_name})`,
        pastor_start_date: sql<string | null>`COALESCE(${pastorMember.pastoring_start_date}, ${missions.pastor_start_date})`,
        established_date: missions.established_date,
        organized_date: missions.organized_date,
        status: missions.status,
        created_at: missions.created_at,
        member_count: sql<number>`count(${members.id})::int`,
      })
      .from(missions)
      .leftJoin(members, eq(members.mission_id, missions.id))
      .leftJoin(pastorMember, eq(missions.pastor_id, pastorMember.id))
      .groupBy(missions.id, pastorMember.id, pastorMember.first_name, pastorMember.last_name, pastorMember.pastoring_start_date)
      .orderBy(missions.name)
    return data
  } catch (error) {
    console.error("Error fetching missions:", error)
    return []
  }
}

export async function createMission(data: {
  name: string
  location?: string
  pastor_id?: string
  pastor_name?: string
  pastor_start_date?: string
  established_date?: string
  organized_date?: string
  status?: string
}) {
  await requireAdmin()
  try {
    const newMission = await db.insert(missions).values({
      name: data.name,
      location: data.location || null,
      pastor_id: data.pastor_id || null,
      pastor_name: data.pastor_name || null,
      pastor_start_date: data.pastor_start_date || null,
      established_date: data.established_date || null,
      organized_date: data.organized_date || null,
      status: data.status || 'mission_outreach',
    }).returning()
    
    if (data.pastor_id) {
      await db.update(members).set({ mission_id: newMission[0].id }).where(eq(members.id, data.pastor_id))
    }

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
    pastor_id?: string
    pastor_name?: string
    pastor_start_date?: string
    established_date?: string
    organized_date?: string
    status?: string
  }
) {
  await requireAdmin()
  try {
    const updatedMission = await db.update(missions).set({
      name: data.name,
      location: data.location || null,
      pastor_id: data.pastor_id || null,
      pastor_name: data.pastor_name || null,
      pastor_start_date: data.pastor_start_date || null,
      established_date: data.established_date || null,
      organized_date: data.organized_date || null,
      status: data.status || 'mission_outreach',
    }).where(eq(missions.id, id)).returning()
    
    if (data.pastor_id) {
      await db.update(members).set({ mission_id: id }).where(eq(members.id, data.pastor_id))
    }

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
