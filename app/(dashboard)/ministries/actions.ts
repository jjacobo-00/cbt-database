"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function getMinistries() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ministries")
    .select("id, name, created_at")
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching ministries:", error)
    return []
  }
  return data
}

export async function createMinistry(name: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("ministries").insert({ name: name.trim() })

  if (error) {
    if (error.code === "23505") throw new Error("A ministry with that name already exists.")
    console.error("Error creating ministry:", error)
    throw new Error("Failed to create ministry.")
  }
  revalidatePath("/ministries")
}

export async function deleteMinistry(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("ministries").delete().eq("id", id)

  if (error) {
    console.error("Error deleting ministry:", error)
    throw new Error("Failed to delete ministry.")
  }
  revalidatePath("/ministries")
}
