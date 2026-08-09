export const DEMOGRAPHIC_MINISTRY_NAMES = [
  "Men of Faith",
  "Ladies for Christ",
  "Youth Christian Ministry",
] as const

export const DEMOGRAPHIC_MINISTRIES_CONFIG = [
  { name: "Men of Faith", description: "Men's Fellowship & Demographic Ministry" },
  { name: "Ladies for Christ", description: "Women's Fellowship & Demographic Ministry" },
  { name: "Youth Christian Ministry", description: "Youth & Student Demographic Ministry" },
] as const

export type DemographicMinistryName = (typeof DEMOGRAPHIC_MINISTRY_NAMES)[number]

/**
 * Checks whether a given ministry name belongs to one of the 3 core demographic fellowships
 * for attendance recording (Men of Faith, Ladies for Christ, Youth Christian Ministry).
 * Robust to casing, spacing, and suffix variations.
 */
export function isDemographicMinistry(name: string): boolean {
  if (!name) return false
  const clean = name.toLowerCase().trim()
  return (
    clean.includes("men of faith") ||
    clean.includes("ladies for christ") ||
    clean.includes("youth christian")
  )
}

/**
 * Returns the demographic category key ('men', 'ladies', 'youth') for consistent styling.
 */
export function getDemographicCategory(name: string): "men" | "ladies" | "youth" | null {
  if (!name) return null
  const clean = name.toLowerCase().trim()
  if (clean.includes("men of faith")) return "men"
  if (clean.includes("ladies for christ")) return "ladies"
  if (clean.includes("youth christian")) return "youth"
  return null
}
