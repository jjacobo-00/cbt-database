"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { offering_categories } from "@/db/schema"
import { eq, asc } from "drizzle-orm"
import { runAction, safeQuery } from "@/lib/utils/actions"

function toOfferingValues(name: string, description: string, isMonthly: boolean, month?: number | null) {
  return {
    name: name.trim(),
    description: description?.trim() || null,
    is_monthly: isMonthly,
    month: month || null,
  }
}

export async function getOfferingCategories() {
  return safeQuery("fetching offering categories", async () => {
    const data = await db.select().from(offering_categories).orderBy(asc(offering_categories.name))
    return data.map(o => ({ ...o, created_at: o.created_at?.toISOString() || "" }))
  }, [])
}

export async function createOfferingCategory(name: string, description: string, isMonthly: boolean, month?: number | null) {
  await runAction("creating offering category", "Failed to create offering category.", () =>
    db.insert(offering_categories).values(toOfferingValues(name, description, isMonthly, month))
  )
  revalidatePath("/commitments/offerings")
}

export async function updateOfferingCategory(id: string, name: string, description: string, isMonthly: boolean, month?: number | null) {
  await runAction("updating offering category", "Failed to update offering category.", () =>
    db.update(offering_categories).set(toOfferingValues(name, description, isMonthly, month)).where(eq(offering_categories.id, id))
  )
  revalidatePath("/commitments/offerings")
}

export async function deleteOfferingCategory(id: string) {
  await runAction("deleting offering category", "Failed to delete offering category.", () =>
    db.delete(offering_categories).where(eq(offering_categories.id, id))
  )
  revalidatePath("/commitments/offerings")
}
