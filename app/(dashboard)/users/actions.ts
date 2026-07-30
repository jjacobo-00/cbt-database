"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { whitelisted_users } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getWhitelistedUsers() {
  return await db.query.whitelisted_users.findMany({
    orderBy: (users, { desc }) => [desc(users.created_at)],
  })
}

export async function addWhitelistedUser(formData: FormData) {
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;

  if (!email) {
    throw new Error("An email address is required.")
  }

  const [inserted] = await db.insert(whitelisted_users).values({
    email,
    name: name || null,
  }).onConflictDoNothing().returning();

  if (!inserted) {
    throw new Error(`${email} is already whitelisted.`)
  }

  revalidatePath("/users")
}

export async function removeWhitelistedUser(id: string) {
  await db.delete(whitelisted_users).where(eq(whitelisted_users.id, id));
  revalidatePath("/users")
}
