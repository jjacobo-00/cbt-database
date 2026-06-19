"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function createMember(formData: FormData) {
  const supabase = await createClient()

  const first_name = formData.get("first_name") as string
  const last_name = formData.get("last_name") as string
  const contact_number = formData.get("contact_number") as string
  const city = formData.get("city") as string
  const occupation = formData.get("occupation") as string

  const { data, error } = await supabase.from("members").insert({
    first_name,
    last_name,
    contact_number,
    city,
    occupation
  }).select().single()

  if (error) {
    console.error("Error creating member:", error)
    throw new Error("Failed to create member")
  }

  revalidatePath("/members")
  redirect(`/members/${data.id}`)
}
