"use server"

import { requireAuth } from "@/lib/auth-guard"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { offering_categories } from "@/db/schema"
import { eq, asc } from "drizzle-orm"

export async function getOfferingCategories() {
  await requireAuth()
  try {
    const data = await db.select().from(offering_categories).orderBy(asc(offering_categories.name))
    return data.map(o => ({ ...o, created_at: o.created_at?.toISOString() || "" }))
  } catch (error) {
    console.error("Error fetching offering categories:", error)
    return []
  }
}

export async function createOfferingCategory(name: string, description: string, isMonthly: boolean, month?: number | null) {
  await requireAuth()
  try {
    await db.insert(offering_categories).values({
      name: name.trim(),
      description: description?.trim() || null,
      is_monthly: isMonthly,
      month: month || null,
    })
  } catch (error) {
    console.error("Error creating offering category:", error)
    throw new Error("Failed to create offering category.")
  }
  revalidatePath("/commitments/offerings")
}

export async function updateOfferingCategory(id: string, name: string, description: string, isMonthly: boolean, month?: number | null) {
  await requireAuth()
  try {
    await db.update(offering_categories).set({
      name: name.trim(),
      description: description?.trim() || null,
      is_monthly: isMonthly,
      month: month || null,
    }).where(eq(offering_categories.id, id))
  } catch (error) {
    console.error("Error updating offering category:", error)
    throw new Error("Failed to update offering category.")
  }
  revalidatePath("/commitments/offerings")
}

export async function deleteOfferingCategory(id: string) {
  await requireAuth()
  try {
    await db.delete(offering_categories).where(eq(offering_categories.id, id))
  } catch (error) {
    console.error("Error deleting offering category:", error)
    throw new Error("Failed to delete offering category.")
  }
  revalidatePath("/commitments/offerings")
}
