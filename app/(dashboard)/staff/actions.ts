"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function createStaff(formData: FormData) {
  // Using the standard client here. In a real production deployment with
  // service-level user creation disabled for anon/authenticated roles,
  // we would initialize a Supabase client with the SERVICE_ROLE_KEY to bypass RLS.
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // We are creating a mock response logic to ensure architecture fits
  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    console.error("Error creating staff:", error)
    throw new Error(error.message)
  }

  revalidatePath("/staff")
}
