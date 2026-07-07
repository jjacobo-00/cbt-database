"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createSession } from "@/lib/session"

export async function login(formData: FormData) {
  const password = formData.get("password") as string
  const masterPassword = process.env.MASTER_PASSWORD || "admin123"

  if (password !== masterPassword) {
    redirect("/login?error=Invalid login credentials")
  }

  await createSession()

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function logout() {
  const { destroySession } = await import("@/lib/session")
  await destroySession()
  redirect("/login")
}
