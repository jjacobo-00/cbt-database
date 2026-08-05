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

/**
 * Normalizes a city/municipality name to a canonical form.
 * Maps known aliases (e.g. "olongapo" → "Olongapo City") and Title Cases unknown entries.
 */
const CITY_ALIAS_MAP: Record<string, string> = {
  "olongapo": "Olongapo City",
  "olongapo city": "Olongapo City",
  "subic": "Subic",
  "subic town": "Subic",
  "castillejos": "Castillejos",
  "san marcelino": "San Marcelino",
  "san antonio": "San Antonio",
  "san narciso": "San Narciso",
  "botolan": "Botolan",
  "iba": "Iba",
  "dinalupihan": "Dinalupihan",
  "hermosa": "Hermosa",
  "bacolor": "Bacolor",
  "angeles": "Angeles City",
  "angeles city": "Angeles City",
  "san fernando": "San Fernando",
  "san fernando city": "San Fernando",
}

export function normalizeCity(city?: string | null): string {
  if (!city || typeof city !== "string") return ""
  const trimmed = city.trim()
  if (!trimmed) return ""

  const key = trimmed.toLowerCase()
  if (CITY_ALIAS_MAP[key]) return CITY_ALIAS_MAP[key]

  // Title Case fallback for unknown cities
  return formatName(trimmed)
}
