type NameParts = {
  first_name?: string | null
  middle_name?: string | null
  last_name?: string | null
  suffix?: string | null
}

type DateInput = Date | string | number | null | undefined

const SHORT_DATE_OPTIONS: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
const LONG_DATE_OPTIONS: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" }

export function getInitials(firstName?: string | null, lastName?: string | null) {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase()
}

export function getFullName(member: NameParts) {
  return [member.first_name, member.last_name].filter(Boolean).join(" ")
}

export function getFullLegalName(member: NameParts) {
  return [member.first_name, member.middle_name, member.last_name, member.suffix].filter(Boolean).join(" ")
}

function toDate(value: DateInput) {
  if (value === null || value === undefined || value === "") return null
  const date = value instanceof Date ? value : new Date(value)
  return isNaN(date.getTime()) ? null : date
}

export function formatDate(
  value: DateInput,
  { locale, fallback = "-", options }: { locale?: string; fallback?: string; options?: Intl.DateTimeFormatOptions } = {}
) {
  const date = toDate(value)
  if (!date) return fallback
  return date.toLocaleDateString(locale, options)
}

export function formatShortDate(value: DateInput, opts: { locale?: string; fallback?: string } = {}) {
  return formatDate(value, { ...opts, options: SHORT_DATE_OPTIONS })
}

export function formatLongDate(value: DateInput, opts: { locale?: string; fallback?: string } = {}) {
  return formatDate(value, { ...opts, options: LONG_DATE_OPTIONS })
}

/** Whole years between `value` and now, or null when `value` is not a usable date. */
export function yearsSince(value: DateInput) {
  const date = toDate(value)
  if (!date) return null
  const today = new Date()
  let years = today.getFullYear() - date.getFullYear()
  const months = today.getMonth() - date.getMonth()
  if (months < 0 || (months === 0 && today.getDate() < date.getDate())) years--
  return Math.max(0, years)
}

/** Difference in calendar years only — used where day/month precision is not available. */
export function calendarYearsSince(value: DateInput) {
  const date = toDate(value)
  if (!date) return null
  return new Date().getFullYear() - date.getFullYear()
}

export function getCurrentYear() {
  return new Date().getFullYear()
}
