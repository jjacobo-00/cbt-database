export const AGE_GROUPS = [
  { label: "All Ages", value: "all" },
  { label: "Kids (0-12)", value: "kids" },
  { label: "Youth (13-17)", value: "youth" },
  { label: "Young Adults (18-35)", value: "young_adults" },
  { label: "Adults (36-59)", value: "adults" },
  { label: "Seniors (60+)", value: "seniors" },
] as const

export const GENDER_OPTIONS = [
  { label: "All Genders", value: "all" },
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
] as const

export const MARITAL_OPTIONS = [
  "Single",
  "Married",
  "Widowed",
  "Separated",
] as const

export const JOINED_OPTIONS = [
  { label: "Any Time", value: "all" },
  { label: "This Month", value: "this_month" },
  { label: "This Year", value: "this_year" },
  { label: "Last Year", value: "last_year" },
] as const

export function calculateYearsInChurch(dateString?: string | null): number | null {
  if (!dateString) return null
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return null
  const today = new Date()
  let y = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) y--
  return Math.max(0, y)
}
