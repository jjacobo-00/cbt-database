import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ROMAN_NUMERALS = new Set([
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"
])

/**
 * Normalizes and formats a name suffix (e.g. "jr", "jr.", "III", "ii" -> "Jr.", "III", "II").
 */
export function formatSuffix(suffix?: string | null): string {
  if (!suffix || typeof suffix !== "string") return ""
  const trimmed = suffix.trim()
  if (!trimmed) return ""

  const clean = trimmed.replace(/\./g, "").toUpperCase()
  if (ROMAN_NUMERALS.has(clean)) {
    return clean
  }
  if (clean === "JR") return "Jr."
  if (clean === "SR") return "Sr."
  if (clean === "ESQ") return "Esq."
  if (clean === "PHD") return "PhD"
  if (clean === "MD") return "MD"

  // Title case for other suffixes
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

/**
 * Capitalizes the first letter of each word in a name string,
 * converting ALL CAPS or lowercase names into clean Title Case (e.g. "Liza Biado").
 * Correctly preserves Roman numerals (e.g. "III", "IV") and suffixes (e.g. "Jr.", "Sr.").
 */
export function formatName(name?: string | null): string {
  if (!name || typeof name !== "string") return ""
  const trimmed = name.trim()
  if (!trimmed) return ""
  
  return trimmed
    .split(/\s+/)
    .map(word => {
      if (!word) return ""
      const upper = word.replace(/\./g, "").toUpperCase()
      if (ROMAN_NUMERALS.has(upper)) {
        return upper
      }
      if (upper === "JR") return "Jr."
      if (upper === "SR") return "Sr."
      if (upper === "ESQ") return "Esq."
      if (upper === "PHD") return "PhD"
      if (upper === "MD") return "MD"

      // Handle hyphenated names like "Mary-Ann" or "D'Cruz"
      return word.toLowerCase().replace(/(?:^|[-'\u2019])\w/g, (char) => char.toUpperCase())
    })
    .join(" ")
}

/**
 * Formats a complete member name from parts, including first name, optional middle name/initial,
 * last name, and suffix.
 */
export function formatFullName(
  member?: {
    first_name?: string | null
    middle_name?: string | null
    last_name?: string | null
    suffix?: string | null
  } | null,
  options?: {
    includeMiddle?: boolean
    middleFormat?: "initial" | "full"
  }
): string {
  if (!member) return ""
  const firstName = formatName(member.first_name || "")
  const lastName = formatName(member.last_name || "")
  const suffix = formatSuffix(member.suffix)

  let middle = ""
  if (options?.includeMiddle && member.middle_name) {
    const rawMiddle = formatName(member.middle_name)
    if (rawMiddle) {
      if (options.middleFormat === "initial") {
        middle = `${rawMiddle.charAt(0)}.`
      } else {
        middle = rawMiddle
      }
    }
  }

  return [firstName, middle, lastName, suffix].filter(Boolean).join(" ")
}

/**
 * Calculates current age from a birth date string (YYYY-MM-DD or ISO).
 */
export function calculateAge(birthDateStr?: string | null): number | null {
  if (!birthDateStr) return null
  const cleanStr = String(birthDateStr).split("T")[0]
  const parts = cleanStr.split("-")
  
  let birthDate: Date
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const day = parseInt(parts[2], 10)
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null
    birthDate = new Date(year, month, day)
  } else {
    birthDate = new Date(birthDateStr)
  }

  if (isNaN(birthDate.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age >= 0 ? age : null
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

/**
 * Formats a date string into church standard birthday format: "Jan. 1, 2026".
 * Abbreviations: Jan., Feb., Mar., Apr., May, Jun., Jul., Aug., Sept., Oct., Nov., Dec.
 */
export function formatBirthday(dateStr?: string | null): string {
  if (!dateStr) return "-"
  // Support YYYY-MM-DD or ISO strings without timezone shift
  const cleanStr = String(dateStr).split("T")[0]
  const parts = cleanStr.split("-")
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10)
    const monthIndex = parseInt(parts[1], 10) - 1
    const day = parseInt(parts[2], 10)
    if (!isNaN(year) && !isNaN(monthIndex) && !isNaN(day) && monthIndex >= 0 && monthIndex <= 11) {
      const monthNames = [
        "Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.",
        "Jul.", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."
      ]
      return `${monthNames[monthIndex]} ${day}, ${year}`
    }
  }

  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return "-"
  const monthNames = [
    "Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.",
    "Jul.", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."
  ]
  return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

/**
 * Returns ordinal string e.g. 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 25 -> "25th"
 */
export function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

/**
 * Calculates and formats wedding anniversary milestone e.g. "3rd Anniversary (3 yrs)" or "25th Anniversary (Silver)"
 */
export function formatAnniversaryMilestone(anniversaryDateStr?: string | null): string {
  if (!anniversaryDateStr) return ""
  const parts = String(anniversaryDateStr).split("T")[0].split("-")
  let startYear = -1
  if (parts.length === 3) {
    startYear = parseInt(parts[0], 10)
  } else {
    const d = new Date(anniversaryDateStr)
    if (!isNaN(d.getTime())) startYear = d.getFullYear()
  }
  if (startYear <= 0) return ""

  const currentYear = new Date().getFullYear()
  const years = currentYear - startYear
  if (years <= 0) return "1st Year Anniversary"

  const ordinal = getOrdinalSuffix(years)
  if (years === 25) return `${ordinal} Anniversary (Silver)`
  if (years === 50) return `${ordinal} Anniversary (Golden)`
  if (years === 60) return `${ordinal} Anniversary (Diamond)`
  return `${ordinal} Anniversary (${years} yrs)`
}


