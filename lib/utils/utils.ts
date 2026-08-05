import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Capitalizes the first letter of each word in a name string,
 * converting ALL CAPS or lowercase names into clean Title Case (e.g. "Liza Biado").
 */
export function formatName(name?: string | null): string {
  if (!name || typeof name !== "string") return ""
  const trimmed = name.trim()
  if (!trimmed) return ""
  
  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .map(word => {
      if (!word) return ""
      // Handle hyphenated names like "Mary-Ann" or "D'Cruz"
      return word.replace(/(?:^|[-'\u2019])\w/g, (char) => char.toUpperCase())
    })
    .join(" ")
}
