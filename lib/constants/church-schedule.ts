export type ServiceTimeSlot = "AM" | "PM"

export interface ServiceSlotOption {
  value: ServiceTimeSlot
  label: string
  shortLabel: string
  icon: "sun" | "moon"
  description: string
}

/**
 * Returns available church service slots based on the date.
 * - Sunday (0): AM (Sunday AM) & PM (Sunday PM)
 * - Wednesday (3): PM only (labeled simply as "Wednesday")
 * - Other days: AM & PM
 */
export function getAvailableServiceSlots(dateStr: string): ServiceSlotOption[] {
  if (!dateStr) {
    return [
      { value: "AM", label: "Sunday AM", shortLabel: "Sunday AM", icon: "sun", description: "Morning Service & Sunday School" },
      { value: "PM", label: "Sunday PM", shortLabel: "Sunday PM", icon: "moon", description: "Evening Service" },
    ]
  }

  const [year, month, day] = dateStr.split("-").map(Number)
  const d = new Date(year, month - 1, day)
  const dayOfWeek = d.getDay() // 0 = Sunday, 3 = Wednesday

  if (dayOfWeek === 3) {
    // Wednesday: PM only
    return [
      { value: "PM", label: "Wednesday", shortLabel: "Wednesday", icon: "moon", description: "Midweek Prayer & Bible Study" },
    ]
  }

  if (dayOfWeek === 0) {
    // Sunday: AM and PM
    return [
      { value: "AM", label: "Sunday AM", shortLabel: "Sunday AM", icon: "sun", description: "Morning Service & Sunday School" },
      { value: "PM", label: "Sunday PM", shortLabel: "Sunday PM", icon: "moon", description: "Evening Service" },
    ]
  }

  // Other days
  return [
    { value: "AM", label: "AM Service", shortLabel: "AM", icon: "sun", description: "Morning Service" },
    { value: "PM", label: "PM Service", shortLabel: "PM", icon: "moon", description: "Evening Service" },
  ]
}

/**
 * Returns default service slot for a date:
 * - Wednesday -> "PM"
 * - Sunday / others -> "AM"
 */
export function getDefaultServiceSlot(dateStr: string): ServiceTimeSlot {
  if (!dateStr) return "AM"
  const [year, month, day] = dateStr.split("-").map(Number)
  const d = new Date(year, month - 1, day)
  return d.getDay() === 3 ? "PM" : "AM"
}

/**
 * Returns readable badge label for a session
 */
export function formatServiceSlotBadge(dateStr: string, serviceTime: string): { label: string; icon: "sun" | "moon" } {
  if (!dateStr) return { label: serviceTime || "AM", icon: serviceTime === "PM" ? "moon" : "sun" }
  const [year, month, day] = dateStr.split("-").map(Number)
  const d = new Date(year, month - 1, day)
  const dayOfWeek = d.getDay()

  if (dayOfWeek === 3) {
    return { label: "Wednesday", icon: "moon" }
  }

  if (dayOfWeek === 0) {
    return {
      label: serviceTime === "PM" ? "Sunday PM" : "Sunday AM",
      icon: serviceTime === "PM" ? "moon" : "sun",
    }
  }

  return {
    label: `${serviceTime || "AM"} Service`,
    icon: serviceTime === "PM" ? "moon" : "sun",
  }
}
