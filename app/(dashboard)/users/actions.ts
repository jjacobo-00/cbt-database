"use server"

import { requireAuth } from "@/lib/auth-guard"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { whitelisted_users } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getWhitelistedUsers() {
  await requireAuth()
  return await db.query.whitelisted_users.findMany({
    orderBy: (users, { desc }) => [desc(users.created_at)],
  })
}

export async function addWhitelistedUser(formData: FormData) {
  await requireAuth()
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;

  if (!email) return;

  await db.insert(whitelisted_users).values({
    email,
    name: name || null,
  }).onConflictDoNothing();

  revalidatePath("/users")
}

export async function removeWhitelistedUser(id: string) {
  await requireAuth()
  await db.delete(whitelisted_users).where(eq(whitelisted_users.id, id));
  revalidatePath("/users")
}
