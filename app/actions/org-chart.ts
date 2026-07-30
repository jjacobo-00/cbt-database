"use server"

import { db } from "@/db"
import { org_chart_nodes } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function addOrgNode(data: { role_title: string; member_id: string | null; parent_id: string | null; sort_order?: number }) {
  try {
    await db.insert(org_chart_nodes).values({
      role_title: data.role_title,
      member_id: data.member_id || null,
      parent_id: data.parent_id || null,
      sort_order: data.sort_order || 0
    })
    
    revalidatePath("/org-chart")
    return { success: true as const }
  } catch (error) {
    console.error("Error adding org node:", error)
    return { success: false as const, error: "Could not add the role. Please try again." }
  }
}

export async function updateOrgNode(id: string, data: { role_title: string; member_id: string | null; parent_id: string | null }) {
  try {
    await db.update(org_chart_nodes)
      .set({
        role_title: data.role_title,
        member_id: data.member_id || null,
        parent_id: data.parent_id || null,
      })
      .where(eq(org_chart_nodes.id, id))
      
    revalidatePath("/org-chart")
    return { success: true as const }
  } catch (error) {
    console.error("Error updating org node:", error)
    return { success: false as const, error: "Could not update the role. Please try again." }
  }
}

export async function deleteOrgNode(id: string) {
  try {
    // Note: Because parent_id has onDelete: 'set null', deleting a parent will just orphan children, 
    // rather than cascade deleting the whole branch, which is safer for a configurable tree.
    await db.delete(org_chart_nodes).where(eq(org_chart_nodes.id, id))
    
    revalidatePath("/org-chart")
    return { success: true as const }
  } catch (error) {
    console.error("Error deleting org node:", error)
    return { success: false as const, error: "Could not delete the role. Please try again." }
  }
}
