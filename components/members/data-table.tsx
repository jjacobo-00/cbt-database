"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { formatName, normalizeCity, formatBirthday, formatFullName, formatSuffix, calculateAge } from "@/lib/utils/utils"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { GenerateInviteLinkButton } from "./GenerateInviteLinkButton"
import { AGE_GROUPS, GENDER_OPTIONS, MARITAL_OPTIONS, JOINED_OPTIONS } from "@/lib/constants/directory"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronRight, User2, Filter, X, Sparkles, RotateCcw, Phone, Mail, Cake, ArrowUp, ArrowDown, ArrowUpDown, Calendar } from "lucide-react"
import { TablePagination } from "@/components/ui/table-pagination"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils/utils"

interface MinistryOption {
  id: string
  name: string
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  ministriesList?: MinistryOption[]
}

const BAPTIZED_OPTIONS = [
  { id: "this_year", label: "Baptized This Year (2026)" },
  { id: "true", label: "All Baptized Members" },
]
const EDUCATION_OPTIONS = ["Elementary", "High School", "Senior High School", "Vocational", "College", "Postgraduate"]
const BLOOD_TYPES = ["A+", "A-", "A", "B+", "B-", "B", "AB+", "AB-", "AB", "O+", "O-", "O"]
const EMPLOYMENT_OPTIONS = ["Employed", "Self-employed", "Unemployed", "Student", "Retired"]

const BIRTH_MONTH_OPTIONS = [
  { id: "1", label: "January" },
  { id: "2", label: "February" },
  { id: "3", label: "March" },
  { id: "4", label: "April" },
  { id: "5", label: "May" },
  { id: "6", label: "June" },
  { id: "7", label: "July" },
  { id: "8", label: "August" },
  { id: "9", label: "September" },
  { id: "10", label: "October" },
  { id: "11", label: "November" },
  { id: "12", label: "December" },
]

// Helper to parse birth month and day accurately
const getBirthMonthAndDay = (birthDate?: string | null) => {
  if (!birthDate) return { month: 99, day: 99 }
  const parts = String(birthDate).split("T")[0].split("-")
  if (parts.length === 3) {
    const m = parseInt(parts[1], 10)
    const d = parseInt(parts[2], 10)
    if (!isNaN(m) && !isNaN(d)) return { month: m, day: d }
  }
  const d = new Date(birthDate)
  if (!isNaN(d.getTime())) {
    return { month: d.getMonth() + 1, day: d.getDate() }
  }
  return { month: 99, day: 99 }
}

// Helper to get upcoming countdown days
const getCountdownDays = (birthDate?: string | null) => {
  const { month: bMonth, day: bDay } = getBirthMonthAndDay(birthDate)
  if (bMonth === 99) return 9999
  const now = new Date()
  const thisYearBday = new Date(now.getFullYear(), bMonth - 1, bDay)
  if (thisYearBday < now && Math.abs(now.getDate() - bDay) > 0) {
    thisYearBday.setFullYear(now.getFullYear() + 1)
  }
  const diffTime = thisYearBday.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Helper to get time value of a date string
const getTimestamp = (dateStr?: string | null) => {
  if (!dateStr) return Infinity
  const t = new Date(dateStr).getTime()
  return isNaN(t) ? Infinity : t
}

export function DataTable<TData, TValue>({
  columns,
  data,
  ministriesList = [],
}: DataTableProps<TData, TValue>) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState(searchParams.get("search") || "")
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const [isFilterSheetOpen, setIsFilterSheetOpen] = React.useState(false)

  // Parse active filters from URL query parameters
  const activeAgeGroup = searchParams.get("age_group") || ""
  const activeGender = searchParams.get("gender") || ""
  const activeMarital = searchParams.get("marital_status") || ""
  const activeJoined = searchParams.get("joined") || ""
  const activeBaptized = searchParams.get("baptized") || ""
  const activeMinistry = searchParams.get("ministry") || ""
  const activeEducation = searchParams.get("education") || ""
  const activeBloodType = searchParams.get("blood_type") || ""
  const activeHasAllergies = searchParams.get("has_allergies") || ""
  const activeEmployment = searchParams.get("employment") || ""
  const activeCity = searchParams.get("city") || ""
  const activeBirthMonth = searchParams.get("birth_month") || ""
  const activeBirthdayPreset = searchParams.get("birthday_preset") || ""
  const activeSortDir = (searchParams.get("sort_dir") || "asc").toLowerCase() === "desc" ? "desc" : "asc"

  // Helper to update URL search parameters
  const updateFilters = (newParams: Record<string, string | null>) => {
    // Reset manual column sorting so smart contextual sorting applies cleanly
    setSorting([])
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === "") {
        params.delete(key)
      } else {
        params.set(key, val)
      }
    })
    router.push(`/members?${params.toString()}`, { scroll: false })
  }

  const clearAllFilters = () => {
    setGlobalFilter("")
    setSorting([])
    router.push("/members", { scroll: false })
  }

  // Count active filter parameters
  const activeFilterCount = [
    activeAgeGroup,
    activeGender,
    activeMarital,
    activeJoined,
    activeBaptized,
    activeMinistry,
    activeEducation,
    activeBloodType,
    activeHasAllergies,
    activeEmployment,
    activeCity,
    activeBirthMonth,
    activeBirthdayPreset,
  ].filter(Boolean).length

  // Filter & Contextually Sort dataset based on active smart filters and sort direction
  const filteredData = React.useMemo(() => {
    const isDesc = activeSortDir === "desc"
    const dirMultiplier = isDesc ? -1 : 1

    const list = data.filter((member: any) => {
      // 1. Birth Month & Birthday Preset Filter
      if (activeBirthMonth || activeBirthdayPreset) {
        const bDateStr = member.birth_date
        if (!bDateStr) return false

        const parts = String(bDateStr).split("T")[0].split("-")
        let bMonth = -1
        let bDay = -1
        if (parts.length === 3) {
          bMonth = parseInt(parts[1], 10)
          bDay = parseInt(parts[2], 10)
        } else {
          const d = new Date(bDateStr)
          if (!isNaN(d.getTime())) {
            bMonth = d.getMonth() + 1
            bDay = d.getDate()
          }
        }
        if (bMonth === -1) return false

        const now = new Date()
        const currentMonth = now.getMonth() + 1
        const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1

        if (activeBirthMonth) {
          if (activeBirthMonth === "this_month" && bMonth !== currentMonth) return false
          else if (activeBirthMonth === "next_month" && bMonth !== nextMonth) return false
          else if (!isNaN(Number(activeBirthMonth)) && bMonth !== Number(activeBirthMonth)) return false
        }

        if (activeBirthdayPreset) {
          if (activeBirthdayPreset === "this_month" && bMonth !== currentMonth) return false
          if (activeBirthdayPreset === "next_month" && bMonth !== nextMonth) return false

          if (activeBirthdayPreset === "next_30_days") {
            const thisYearBday = new Date(now.getFullYear(), bMonth - 1, bDay)
            if (thisYearBday < now && Math.abs(now.getDate() - bDay) > 1) {
              thisYearBday.setFullYear(now.getFullYear() + 1)
            }
            const diffTime = thisYearBday.getTime() - now.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            if (diffDays < 0 || diffDays > 30) return false
          }

          if (activeBirthdayPreset === "today_this_week") {
            const thisYearBday = new Date(now.getFullYear(), bMonth - 1, bDay)
            if (thisYearBday < now && Math.abs(now.getDate() - bDay) > 1) {
              thisYearBday.setFullYear(now.getFullYear() + 1)
            }
            const diffTime = thisYearBday.getTime() - now.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            if (diffDays < 0 || diffDays > 7) return false
          }
        }
      }

      // 2. Age Group Filter
      if (activeAgeGroup) {
        let age = member.age
        if ((age === null || age === undefined) && member.birth_date) {
          const bYear = new Date(member.birth_date).getFullYear()
          if (!isNaN(bYear)) age = new Date().getFullYear() - bYear
        }
        if (age === null || age === undefined) return false
        if (activeAgeGroup === "kids" && (age < 0 || age > 12)) return false
        if (activeAgeGroup === "youth" && (age < 13 || age > 17)) return false
        if (activeAgeGroup === "young_adults" && (age < 18 || age > 35)) return false
        if (activeAgeGroup === "adults" && (age < 36 || age > 59)) return false
        if (activeAgeGroup === "seniors" && age < 60) return false
      }

      // 3. Gender / Sex Filter
      if (activeGender) {
        const mGender = (member.gender || member.sex || "").toLowerCase()
        if (mGender !== activeGender.toLowerCase()) return false
      }

      // 4. Marital Status Filter
      if (activeMarital) {
        const mStatus = (member.marital_status || "").toLowerCase()
        if (mStatus !== activeMarital.toLowerCase()) return false
      }

      // 5. Joined Date Filter
      if (activeJoined) {
        const currentYear = new Date().getFullYear()
        const currentMonth = new Date().getMonth()
        const targetDate = member.membership_date
        if (!targetDate) return false
        const d = new Date(targetDate)
        if (isNaN(d.getTime())) return false

        if (activeJoined === "this_year" && d.getFullYear() !== currentYear) return false
        if (activeJoined === "last_year" && d.getFullYear() !== currentYear - 1) return false
        if (activeJoined === "this_month" && (d.getFullYear() !== currentYear || d.getMonth() !== currentMonth)) return false
        if (activeJoined === "recent_growth") {
          const sixMonthsAgo = new Date()
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
          sixMonthsAgo.setDate(1)
          sixMonthsAgo.setHours(0, 0, 0, 0)
          if (d < sixMonthsAgo) return false
        }
        if (activeJoined.startsWith("month_")) {
          const monthKey = activeJoined.replace("month_", "")
          const monthsArr = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
          let targetMonthIdx = monthsArr.findIndex(m => m.toLowerCase() === monthKey.toLowerCase())
          if (targetMonthIdx === -1 && !isNaN(Number(monthKey))) {
            targetMonthIdx = Number(monthKey)
          }
          if (targetMonthIdx !== -1 && d.getMonth() !== targetMonthIdx) return false
        }
      }

      // 6. Baptized Filter
      if (activeBaptized) {
        const bDate = member.date_baptized || member.baptism_date
        if (activeBaptized === "true" && !bDate) return false
        if (activeBaptized === "this_year") {
          if (!bDate) return false
          const d = new Date(bDate)
          if (isNaN(d.getTime()) || d.getFullYear() !== new Date().getFullYear()) return false
        }
      }

      // 7. Ministry Filter
      if (activeMinistry) {
        const mList: string[] = Array.isArray(member.ministries) ? member.ministries : []
        if (activeMinistry === "not_serving") {
          if (mList.length > 0) return false
        } else if (activeMinistry === "serving") {
          if (mList.length === 0) return false
        } else {
          if (!mList.some(name => name.toLowerCase() === activeMinistry.toLowerCase())) return false
        }
      }

      // 8. Educational Attainment Filter
      if (activeEducation) {
        const edu = (member.highest_educational_attainment || "").toLowerCase()
        if (edu !== activeEducation.toLowerCase()) return false
      }

      // 9. Blood Type Filter
      if (activeBloodType) {
        const blood = (member.blood_type || "").trim().toLowerCase()
        const target = activeBloodType.trim().toLowerCase()
        if (target === "b") {
          if (!blood.startsWith("b")) return false
        } else if (target === "a") {
          if (blood !== "a" && blood !== "a+" && blood !== "a-") return false
        } else if (target === "ab") {
          if (!blood.startsWith("ab")) return false
        } else if (target === "o") {
          if (!blood.startsWith("o")) return false
        } else if (blood !== target) {
          return false
        }
      }

      // 10. Allergies Filter
      if (activeHasAllergies) {
        const allergies = (member.allergies || "").trim()
        const hasAllergies = allergies !== "" && allergies.toLowerCase() !== "none"
        if (activeHasAllergies === "true" && !hasAllergies) return false
        if (activeHasAllergies === "false" && hasAllergies) return false
      }

      // 11. Employment Status Filter
      if (activeEmployment) {
        const emp = (member.employment_status || "").toLowerCase()
        if (emp !== activeEmployment.toLowerCase()) return false
      }

      // 12. City Filter (normalized matching)
      if (activeCity) {
        const memberCity = normalizeCity(member.city)
        if (memberCity.toLowerCase() !== activeCity.toLowerCase()) return false
      }

      return true
    })

    // Apply smart contextual ordering ("who's first") + bidirectional ASC / DESC support
    return list.slice().sort((a: any, b: any) => {
      // 1. Birthday Month Filters: Specific Month (this_month, next_month, 1..12)
      if (
        (activeBirthMonth && activeBirthMonth !== "all") ||
        activeBirthdayPreset === "this_month" ||
        activeBirthdayPreset === "next_month"
      ) {
        const dayA = getBirthMonthAndDay(a.birth_date).day
        const dayB = getBirthMonthAndDay(b.birth_date).day
        if (dayA !== dayB) return (dayA - dayB) * dirMultiplier
        return (a.last_name || "").localeCompare(b.last_name || "") * dirMultiplier
      }

      // 2. Birthday Countdown Presets (next_30_days, today_this_week)
      if (activeBirthdayPreset === "next_30_days" || activeBirthdayPreset === "today_this_week") {
        const cdA = getCountdownDays(a.birth_date)
        const cdB = getCountdownDays(b.birth_date)
        if (cdA !== cdB) return (cdA - cdB) * dirMultiplier
        return (a.last_name || "").localeCompare(b.last_name || "") * dirMultiplier
      }

      // 3. Joined / Membership Date (this_year, this_month, last_year, recent_growth, month_*)
      if (activeJoined && activeJoined !== "all") {
        const timeA = getTimestamp(a.membership_date)
        const timeB = getTimestamp(b.membership_date)
        if (timeA !== timeB) return (timeA - timeB) * dirMultiplier
        return (a.last_name || "").localeCompare(b.last_name || "") * dirMultiplier
      }

      // 4. Baptized Date (this_year)
      if (activeBaptized === "this_year") {
        const bTimeA = getTimestamp(a.date_baptized || a.baptism_date)
        const bTimeB = getTimestamp(b.date_baptized || b.baptism_date)
        if (bTimeA !== bTimeB) return (bTimeA - bTimeB) * dirMultiplier
        return (a.last_name || "").localeCompare(b.last_name || "") * dirMultiplier
      }

      // 5. Age Demographic
      if (activeAgeGroup && activeAgeGroup !== "all") {
        const ageA = a.age ?? calculateAge(a.birth_date) ?? 999
        const ageB = b.age ?? calculateAge(b.birth_date) ?? 999
        if (ageA !== ageB) return (ageA - ageB) * dirMultiplier
        return (a.last_name || "").localeCompare(b.last_name || "") * dirMultiplier
      }

      // 6. Default: Last Name, First Name
      const lastNameDiff = (a.last_name || "").localeCompare(b.last_name || "")
      if (lastNameDiff !== 0) return lastNameDiff * dirMultiplier
      return (a.first_name || "").localeCompare(b.first_name || "") * dirMultiplier
    })
  }, [
    data,
    activeAgeGroup,
    activeGender,
    activeMarital,
    activeJoined,
    activeBaptized,
    activeMinistry,
    activeEducation,
    activeBloodType,
    activeHasAllergies,
    activeEmployment,
    activeCity,
    activeBirthMonth,
    activeBirthdayPreset,
    activeSortDir,
  ])

  // Helper to determine the current contextual sort description
  const getSortDescription = () => {
    const isDesc = activeSortDir === "desc"
    if (
      (activeBirthMonth && activeBirthMonth !== "all") ||
      activeBirthdayPreset === "this_month" ||
      activeBirthdayPreset === "next_month"
    ) {
      return isDesc ? "Day 31 → 1 (Latest)" : "Day 1 → 31 (Earliest)"
    }
    if (activeBirthdayPreset === "next_30_days" || activeBirthdayPreset === "today_this_week") {
      return isDesc ? "Furthest → Closest" : "Closest (Today) → Furthest"
    }
    if (activeJoined && activeJoined !== "all") {
      return isDesc ? "Recently Joined First" : "Earliest Joined First"
    }
    if (activeBaptized === "this_year") {
      return isDesc ? "Recently Baptized First" : "Earliest Baptized First"
    }
    if (activeAgeGroup && activeAgeGroup !== "all") {
      return isDesc ? "Oldest → Youngest" : "Youngest → Oldest"
    }
    return isDesc ? "Z → A (Descending)" : "A → Z (Ascending)"
  }

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue || "").trim().toLowerCase()
      if (!q) return true
      const original = row.original as any
      const fullName = `${original.first_name || ""} ${original.middle_name || ""} ${original.last_name || ""} ${original.suffix || ""}`.toLowerCase()
      const reversedName = `${original.last_name || ""}, ${original.first_name || ""} ${original.suffix || ""}`.toLowerCase()
      const suffix = (original.suffix || "").toLowerCase()
      const birthYear = original.birth_date ? String(original.birth_date).split("T")[0].split("-")[0] : ""
      const missionName = (original.mission_name || "CBT Olongapo").toLowerCase()
      const churchRole = (original.church_role || "Member").toLowerCase()
      const city = (original.city || "").toLowerCase()
      const occupation = (original.occupation || "").toLowerCase()
      const contact = (original.contact_number || "").toLowerCase()
      const email = (original.email || "").toLowerCase()
      return (
        fullName.includes(q) ||
        reversedName.includes(q) ||
        suffix.includes(q) ||
        birthYear.includes(q) ||
        missionName.includes(q) ||
        churchRole.includes(q) ||
        city.includes(q) ||
        occupation.includes(q) ||
        contact.includes(q) ||
        email.includes(q)
      )
    },
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
  })

  // Filter Form Inputs UI Component
  const FilterControls = () => (
    <div className="space-y-4 py-2">
      {/* Birth Month Filter */}
      <div className="space-y-1.5 p-3 rounded-xl bg-pink-500/5 border border-pink-500/20">
        <div className="flex items-center gap-1.5">
          <Cake className="h-4 w-4 text-pink-500" />
          <Label className="text-xs font-bold text-pink-700 dark:text-pink-300">Birth Month & Celebrations</Label>
        </div>
        <select
          value={activeBirthMonth}
          onChange={(e) => updateFilters({ birth_month: e.target.value, birthday_preset: null })}
          className="w-full h-10 px-3 rounded-lg border bg-background text-sm font-medium focus:ring-1 focus:ring-primary"
        >
          <option value="">All Birth Months</option>
          <option value="this_month">🎂 This Month ({new Date().toLocaleString('default', { month: 'long' })})</option>
          <option value="next_month">🎂 Next Month ({new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleString('default', { month: 'long' })})</option>
          {BIRTH_MONTH_OPTIONS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Age Group */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">Age Demographic</Label>
        <select
          value={activeAgeGroup}
          onChange={(e) => updateFilters({ age_group: e.target.value })}
          className="w-full h-10 px-3 rounded-lg border bg-background text-sm font-medium focus:ring-1 focus:ring-primary"
        >
          <option value="">All Ages</option>
          {AGE_GROUPS.filter(g => g.value !== "all").map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
      </div>

      {/* Gender */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">Gender / Sex</Label>
        <select
          value={activeGender}
          onChange={(e) => updateFilters({ gender: e.target.value })}
          className="w-full h-10 px-3 rounded-lg border bg-background text-sm font-medium focus:ring-1 focus:ring-primary"
        >
          <option value="">All Genders</option>
          {GENDER_OPTIONS.filter(g => g.value !== "all").map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
      </div>

      {/* Marital Status */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">Civil / Marital Status</Label>
        <select
          value={activeMarital}
          onChange={(e) => updateFilters({ marital_status: e.target.value })}
          className="w-full h-10 px-3 rounded-lg border bg-background text-sm font-medium focus:ring-1 focus:ring-primary"
        >
          <option value="">All Marital Statuses</option>
          {MARITAL_OPTIONS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Joined Date */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">Membership / Joined Date</Label>
        <select
          value={activeJoined}
          onChange={(e) => updateFilters({ joined: e.target.value })}
          className="w-full h-10 px-3 rounded-lg border bg-background text-sm font-medium focus:ring-1 focus:ring-primary"
        >
          <option value="">Any Join Date</option>
          {JOINED_OPTIONS.filter(j => j.value !== "all").map((j) => (
            <option key={j.value} value={j.value}>{j.label}</option>
          ))}
        </select>
      </div>

      {/* Baptized */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">Baptism Status</Label>
        <select
          value={activeBaptized}
          onChange={(e) => updateFilters({ baptized: e.target.value })}
          className="w-full h-10 px-3 rounded-lg border bg-background text-sm font-medium focus:ring-1 focus:ring-primary"
        >
          <option value="">All Members</option>
          {BAPTIZED_OPTIONS.map((b) => (
            <option key={b.id} value={b.id}>{b.label}</option>
          ))}
        </select>
      </div>

      {/* Ministry */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">Ministry Engagement</Label>
        <select
          value={activeMinistry}
          onChange={(e) => updateFilters({ ministry: e.target.value })}
          className="w-full h-10 px-3 rounded-lg border bg-background text-sm font-medium focus:ring-1 focus:ring-primary"
        >
          <option value="">All Ministries</option>
          <option value="serving">Serving in Any Ministry</option>
          <option value="not_serving">Not Yet Serving</option>
          {ministriesList.map((m) => (
            <option key={m.id} value={m.name}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Educational Attainment */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">Educational Attainment</Label>
        <select
          value={activeEducation}
          onChange={(e) => updateFilters({ education: e.target.value })}
          className="w-full h-10 px-3 rounded-lg border bg-background text-sm font-medium focus:ring-1 focus:ring-primary"
        >
          <option value="">All Attainments</option>
          {EDUCATION_OPTIONS.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      {/* Blood Type */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">Blood Type</Label>
        <select
          value={activeBloodType}
          onChange={(e) => updateFilters({ blood_type: e.target.value })}
          className="w-full h-10 px-3 rounded-lg border bg-background text-sm font-medium focus:ring-1 focus:ring-primary"
        >
          <option value="">All Blood Types</option>
          {BLOOD_TYPES.map((bt) => (
            <option key={bt} value={bt}>{bt}</option>
          ))}
        </select>
      </div>

      {/* Allergies */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">Allergies</Label>
        <select
          value={activeHasAllergies}
          onChange={(e) => updateFilters({ has_allergies: e.target.value })}
          className="w-full h-10 px-3 rounded-lg border bg-background text-sm font-medium focus:ring-1 focus:ring-primary"
        >
          <option value="">All</option>
          <option value="true">Has Recorded Allergies</option>
          <option value="false">No Allergies Recorded</option>
        </select>
      </div>

      {/* Employment Status */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">Employment Status</Label>
        <select
          value={activeEmployment}
          onChange={(e) => updateFilters({ employment: e.target.value })}
          className="w-full h-10 px-3 rounded-lg border bg-background text-sm font-medium focus:ring-1 focus:ring-primary"
        >
          <option value="">All Employment Types</option>
          {EMPLOYMENT_OPTIONS.map((emp) => (
            <option key={emp} value={emp}>{emp}</option>
          ))}
        </select>
      </div>

      {/* Sort Direction Reordering Control */}
      <div className="space-y-2 pt-3 border-t">
        <Label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
          <span>Sort Direction / Reorder</span>
          <span className="text-[11px] text-primary font-medium">{getSortDescription()}</span>
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={activeSortDir === "asc" ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilters({ sort_dir: "asc" })}
            className="h-9 text-xs gap-1.5"
          >
            <ArrowUp className="h-3.5 w-3.5" /> Ascending (Earliest / A-Z)
          </Button>
          <Button
            type="button"
            variant={activeSortDir === "desc" ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilters({ sort_dir: "desc" })}
            className="h-9 text-xs gap-1.5"
          >
            <ArrowDown className="h-3.5 w-3.5" /> Descending (Latest / Z-A)
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search by name, role, city..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="h-11 pl-4 pr-9 bg-card border-border shadow-xs"
          />
          {globalFilter && (
            <button
              onClick={() => setGlobalFilter("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop Popover Filter Panel */}
          <div className="hidden sm:block">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-11 gap-2 px-4 border-border bg-card">
                  <Filter className="h-4 w-4 text-primary" />
                  <span>Smart Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-4 shadow-xl border bg-card max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b pb-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h4 className="font-bold text-sm">Smart Directory Filters</h4>
                  </div>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-8 text-xs text-muted-foreground hover:text-destructive">
                      Clear All
                    </Button>
                  )}
                </div>
                <FilterControls />
              </PopoverContent>
            </Popover>
          </div>

          {/* Mobile Dialog Filter Panel */}
          <div className="sm:hidden w-full">
            <Dialog open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-11 w-full gap-2 border-border bg-card">
                  <Filter className="h-4 w-4 text-primary" />
                  <span>Smart Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center ml-auto">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto p-6">
                <DialogHeader className="text-left border-b pb-3">
                  <DialogTitle className="flex items-center gap-2 text-base font-bold">
                    <Sparkles className="h-5 w-5 text-primary" /> Smart Directory Filters
                  </DialogTitle>
                </DialogHeader>
                <FilterControls />
                <div className="pt-4 border-t flex flex-row items-center gap-3">
                  <Button variant="outline" onClick={clearAllFilters} className="flex-1 h-11">
                    Reset
                  </Button>
                  <Button onClick={() => setIsFilterSheetOpen(false)} className="flex-1 h-11">
                    Apply Filters
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Quick Filter Presets Strip */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 touch-contain w-full max-w-full">
        <button
          onClick={clearAllFilters}
          className={cn(
            "h-8 px-3 rounded-full text-xs font-semibold shrink-0 transition-all border flex items-center gap-1",
            activeFilterCount === 0 && !globalFilter
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:bg-muted"
          )}
        >
          All Members ({data.length})
        </button>

        <button
          onClick={() => updateFilters({ birth_month: activeBirthMonth === "this_month" ? null : "this_month", birthday_preset: null })}
          className={cn(
            "h-8 px-3 rounded-full text-xs font-semibold shrink-0 transition-all border flex items-center gap-1.5",
            activeBirthMonth === "this_month"
              ? "bg-pink-600 text-white border-pink-600 shadow-sm"
              : "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/30 hover:bg-pink-500/20"
          )}
        >
          <Cake className="h-3.5 w-3.5" />
          Birthdays This Month ({new Date().toLocaleString('default', { month: 'short' })})
        </button>

        <button
          onClick={() => updateFilters({ birthday_preset: activeBirthdayPreset === "next_30_days" ? null : "next_30_days", birth_month: null })}
          className={cn(
            "h-8 px-3 rounded-full text-xs font-semibold shrink-0 transition-all border flex items-center gap-1.5",
            activeBirthdayPreset === "next_30_days"
              ? "bg-pink-600 text-white border-pink-600 shadow-sm"
              : "bg-card text-muted-foreground border-border hover:bg-muted"
          )}
        >
          <Cake className="h-3.5 w-3.5" />
          Next 30 Days
        </button>

        <button
          onClick={() => updateFilters({ age_group: activeAgeGroup === "young_adults" ? null : "young_adults" })}
          className={cn(
            "h-8 px-3 rounded-full text-xs font-semibold shrink-0 transition-all border flex items-center gap-1",
            activeAgeGroup === "young_adults"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:bg-muted"
          )}
        >
          Young Adults (18-35)
        </button>

        <button
          onClick={() => updateFilters({ joined: activeJoined === "this_year" ? null : "this_year" })}
          className={cn(
            "h-8 px-3 rounded-full text-xs font-semibold shrink-0 transition-all border flex items-center gap-1",
            activeJoined === "this_year"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:bg-muted"
          )}
        >
          Joined This Year (2026)
        </button>

        <button
          onClick={() => updateFilters({ baptized: activeBaptized === "this_year" ? null : "this_year" })}
          className={cn(
            "h-8 px-3 rounded-full text-xs font-semibold shrink-0 transition-all border flex items-center gap-1",
            activeBaptized === "this_year"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:bg-muted"
          )}
        >
          Baptized 2026
        </button>

        <button
          onClick={() => updateFilters({ ministry: activeMinistry === "serving" ? null : "serving" })}
          className={cn(
            "h-8 px-3 rounded-full text-xs font-semibold shrink-0 transition-all border flex items-center gap-1",
            activeMinistry === "serving"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:bg-muted"
          )}
        >
          Serving in Ministry
        </button>

        {/* Reorder ASC / DESC Toggle Button in Presets Bar */}
        <button
          onClick={() => updateFilters({ sort_dir: activeSortDir === "desc" ? "asc" : "desc" })}
          title={`Click to reorder: currently ${getSortDescription()}`}
          className={cn(
            "h-8 px-3 rounded-full text-xs font-semibold shrink-0 transition-all border flex items-center gap-1.5 ml-auto",
            activeSortDir === "desc"
              ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
              : "bg-card text-foreground border-border hover:bg-muted"
          )}
        >
          {activeSortDir === "desc" ? <ArrowDown className="h-3.5 w-3.5 text-primary" /> : <ArrowUp className="h-3.5 w-3.5 text-primary" />}
          <span>{getSortDescription()}</span>
        </button>
      </div>

      {/* Active Filter Chips Bar */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
          <span className="text-xs font-bold text-primary flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Active ({filteredData.length} matching):
          </span>

          {/* Active Sort Direction Pill with One-Click Flip */}
          <button
            onClick={() => updateFilters({ sort_dir: activeSortDir === "desc" ? "asc" : "desc" })}
            title="Click to flip sort order"
            className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/30 px-2.5 py-1 rounded-full font-medium hover:bg-primary/20 transition-colors shadow-2xs"
          >
            {activeSortDir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
            <span>Sort: {getSortDescription()}</span>
          </button>

          {activeBirthMonth && (
            <span className="inline-flex items-center gap-1 text-xs bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/30 px-2.5 py-1 rounded-full font-medium">
              <Cake className="h-3 w-3 text-pink-500" />
              Birth Month: {activeBirthMonth === "this_month" ? `This Month (${new Date().toLocaleString('default', { month: 'short' })})` : activeBirthMonth === "next_month" ? "Next Month" : (BIRTH_MONTH_OPTIONS.find((m) => m.id === activeBirthMonth)?.label || activeBirthMonth)}
              <button onClick={() => updateFilters({ birth_month: null })} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {activeBirthdayPreset && (
            <span className="inline-flex items-center gap-1 text-xs bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/30 px-2.5 py-1 rounded-full font-medium">
              <Cake className="h-3 w-3 text-pink-500" />
              Celebrations: {activeBirthdayPreset === "next_30_days" ? "Next 30 Days" : activeBirthdayPreset === "today_this_week" ? "This Week" : activeBirthdayPreset}
              <button onClick={() => updateFilters({ birthday_preset: null })} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {activeAgeGroup && (
            <span className="inline-flex items-center gap-1 text-xs bg-card border px-2.5 py-1 rounded-full font-medium">
              Age: {AGE_GROUPS.find((g) => g.value === activeAgeGroup)?.label || activeAgeGroup}
              <button onClick={() => updateFilters({ age_group: null })} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {activeGender && (
            <span className="inline-flex items-center gap-1 text-xs bg-card border px-2.5 py-1 rounded-full font-medium">
              Gender: {GENDER_OPTIONS.find((g) => g.value === activeGender)?.label || activeGender}
              <button onClick={() => updateFilters({ gender: null })} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {activeMarital && (
            <span className="inline-flex items-center gap-1 text-xs bg-card border px-2.5 py-1 rounded-full font-medium">
              Civil Status: {activeMarital}
              <button onClick={() => updateFilters({ marital_status: null })} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {activeJoined && (
            <span className="inline-flex items-center gap-1 text-xs bg-card border px-2.5 py-1 rounded-full font-medium">
              Joined: {JOINED_OPTIONS.find((j) => j.value === activeJoined)?.label || activeJoined}
              <button onClick={() => updateFilters({ joined: null })} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {activeBaptized && (
            <span className="inline-flex items-center gap-1 text-xs bg-card border px-2.5 py-1 rounded-full font-medium">
              Baptism: {BAPTIZED_OPTIONS.find((b) => b.id === activeBaptized)?.label || activeBaptized}
              <button onClick={() => updateFilters({ baptized: null })} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {activeMinistry && (
            <span className="inline-flex items-center gap-1 text-xs bg-card border px-2.5 py-1 rounded-full font-medium">
              Ministry: {activeMinistry === "serving" ? "Serving" : activeMinistry === "not_serving" ? "Not Serving" : activeMinistry}
              <button onClick={() => updateFilters({ ministry: null })} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {activeEducation && (
            <span className="inline-flex items-center gap-1 text-xs bg-card border px-2.5 py-1 rounded-full font-medium">
              Education: {activeEducation}
              <button onClick={() => updateFilters({ education: null })} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {activeBloodType && (
            <span className="inline-flex items-center gap-1 text-xs bg-card border px-2.5 py-1 rounded-full font-medium">
              Blood: {activeBloodType}
              <button onClick={() => updateFilters({ blood_type: null })} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {activeHasAllergies && (
            <span className="inline-flex items-center gap-1 text-xs bg-card border px-2.5 py-1 rounded-full font-medium">
              Allergies: {activeHasAllergies === "true" ? "Recorded" : "None"}
              <button onClick={() => updateFilters({ has_allergies: null })} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {activeEmployment && (
            <span className="inline-flex items-center gap-1 text-xs bg-card border px-2.5 py-1 rounded-full font-medium">
              Employment: {activeEmployment}
              <button onClick={() => updateFilters({ employment: null })} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 text-xs text-muted-foreground hover:text-destructive ml-auto">
            <RotateCcw className="h-3 w-3 mr-1" /> Reset All
          </Button>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border bg-card">
        <div className="w-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map((header) => {
                    return (
                      <th key={header.id} className="h-12 px-4 text-left align-middle font-medium">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4 align-middle whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center">
                    No members match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View (Compact List Tiles) */}
      <div className="flex flex-col md:hidden gap-3 mt-2">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const memberId = (row.original as any).id
            const firstName = formatName((row.original as any).first_name || "")
            const lastName = formatName((row.original as any).last_name || "")
            const suffix = formatSuffix((row.original as any).suffix)
            const age = (row.original as any).age ?? calculateAge((row.original as any).birth_date)
            const contact = (row.original as any).contact_number || "No contact info"
            const role = (row.original as any).occupation || "Member"
            const rawContact = (row.original as any).contact_number
            const rawEmail = (row.original as any).email
            const missionName = (row.original as any).mission_name || "CBT Olongapo"
            const isBaptized = Boolean((row.original as any).date_baptized || (row.original as any).baptism_date)
            const lastLoginAt = (row.original as any).last_login_at
            const membershipDate = (row.original as any).membership_date
            const dateBaptized = (row.original as any).date_baptized || (row.original as any).baptism_date
            
            const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()

            return (
              <div 
                key={row.id} 
                className="group relative flex items-center justify-between p-4 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <Link
                  href={`/members/${memberId}`}
                  className="flex items-center gap-3.5 min-w-0 flex-1 pr-2"
                >
                  <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-inner">
                    {initials || <User2 className="h-6 w-6" />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="font-semibold text-foreground text-base truncate">
                        {firstName} {lastName}
                      </span>
                      {suffix && (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-bold bg-primary/15 text-primary border border-primary/30 shrink-0">
                          {suffix}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                        {missionName}
                      </span>
                      {(row.original as any).birth_date && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-700 dark:text-pink-300 shrink-0 flex items-center gap-1">
                          <Cake className="h-3 w-3" />
                          {formatBirthday((row.original as any).birth_date)}
                          {age !== null && <span className="opacity-80">({age} yrs)</span>}
                        </span>
                      )}
                      {activeJoined && membershipDate && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary shrink-0 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined: {formatBirthday(membershipDate)}
                        </span>
                      )}
                      {activeBaptized && dateBaptized && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 shrink-0">
                          Baptized: {formatBirthday(dateBaptized)}
                        </span>
                      )}
                      {lastLoginAt && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shrink-0">
                          Login: {new Date(lastLoginAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground truncate">
                        {contact}
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-border/50">
                  {rawContact && (
                    <a
                      href={`tel:${rawContact}`}
                      title="Call member"
                      className="p-2 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                  {rawEmail && (
                    <a
                      href={`mailto:${rawEmail}`}
                      title="Email member"
                      className="p-2 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  )}
                  <Link
                    href={`/members/${memberId}`}
                    title="View details"
                    className="p-2 rounded-full bg-muted/50 hover:bg-primary hover:text-primary-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center p-8 text-muted-foreground border rounded-2xl bg-card space-y-3">
            <p className="font-medium">No members match the selected filters.</p>
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              Reset All Filters
            </Button>
          </div>
        )}
      </div>

      <TablePagination table={table} entityLabel="members" />
    </div>
  )
}
