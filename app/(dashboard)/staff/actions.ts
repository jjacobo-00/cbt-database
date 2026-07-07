"use server"

import { revalidatePath } from "next/cache"

export async function createStaff(formData: FormData) {
  // Staff management is handled via the master password system.
  // Individual staff accounts are not required in the current setup.
  revalidatePath("/staff")
}
