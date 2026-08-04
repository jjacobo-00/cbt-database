"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { ChevronRight, User2, Filter, X, Sparkles, RotateCcw, Phone, Mail } from "lucide-react"
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
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
const EMPLOYMENT_OPTIONS = ["Employed", "Self-employed", "Unemployed", "Student", "Retired"]

export function DataTable<TData, TValue>({
  columns,
  data,
  ministriesList = [],
}: DataTableProps<TData, TValue>) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
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

  // Helper to update URL search parameters
  const updateFilters = (newParams: Record<string, string | null>) => {
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
  ].filter(Boolean).length

  // Filter dataset based on active smart filters
  const filteredData = React.useMemo(() => {
    return data.filter((member: any) => {
      // Age Group Filter
      if (activeAgeGroup) {
        let age = member.age
        if ((age === null || age === undefined) && member.birth_date) {
          const bYear = new Date(member.birth_date).getFullYear()
          if (!isNaN(bYear)) age = new Date().getFullYear() - bYear
        }
        if (age === null || age === undefined) return false
        if (activeAgeGroup === "kids" && (age < 0 || age > 12)) return false
        if (activeAgeGroup === "teens" && (age < 13 || age > 17)) return false
        if (activeAgeGroup === "young_adults" && (age < 18 || age > 35)) return false
        if (activeAgeGroup === "adults" && (age < 36 || age > 59)) return false
        if (activeAgeGroup === "seniors" && age < 60) return false
      }

      // Gender / Sex Filter
      if (activeGender) {
        const mGender = (member.gender || member.sex || "").toLowerCase()
        if (mGender !== activeGender.toLowerCase()) return false
      }

      // Marital Status Filter
      if (activeMarital) {
        const mStatus = (member.marital_status || "").toLowerCase()
        if (mStatus !== activeMarital.toLowerCase()) return false
      }

      // Joined Date Filter
      if (activeJoined) {
        const currentYear = new Date().getFullYear()
        const currentMonth = new Date().getMonth()
        const targetDate = member.membership_date || member.created_at
        if (!targetDate) return false
        const d = new Date(targetDate)
        if (isNaN(d.getTime())) return false

        if (activeJoined === "this_year" && d.getFullYear() !== currentYear) return false
        if (activeJoined === "last_year" && d.getFullYear() !== currentYear - 1) return false
        if (activeJoined === "this_month" && (d.getFullYear() !== currentYear || d.getMonth() !== currentMonth)) return false
      }

      // Baptized Filter
      if (activeBaptized) {
        const bDate = member.date_baptized || member.baptism_date
        if (activeBaptized === "true" && !bDate) return false
        if (activeBaptized === "this_year") {
          if (!bDate) return false
          const d = new Date(bDate)
          if (isNaN(d.getTime()) || d.getFullYear() !== new Date().getFullYear()) return false
        }
      }

      // Ministry Filter
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

      // Educational Attainment Filter
      if (activeEducation) {
        const edu = (member.highest_educational_attainment || "").toLowerCase()
        if (edu !== activeEducation.toLowerCase()) return false
      }

      // Blood Type Filter
      if (activeBloodType) {
        const blood = (member.blood_type || "").toLowerCase()
        if (blood !== activeBloodType.toLowerCase()) return false
      }

      // Allergies Filter
      if (activeHasAllergies) {
        const allergies = (member.allergies || "").trim()
        const hasAllergies = allergies !== "" && allergies.toLowerCase() !== "none"
        if (activeHasAllergies === "true" && !hasAllergies) return false
        if (activeHasAllergies === "false" && hasAllergies) return false
      }

      // Employment Status Filter
      if (activeEmployment) {
        const emp = (member.employment_status || "").toLowerCase()
        if (emp !== activeEmployment.toLowerCase()) return false
      }

      return true
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
  ])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    globalFilterFn: "includesString",
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
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 touch-contain">
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
      </div>

      {/* Active Filter Chips Bar */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
          <span className="text-xs font-bold text-primary flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Active ({filteredData.length} matching):
          </span>

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
            const firstName = (row.original as any).first_name || ""
            const lastName = (row.original as any).last_name || ""
            const contact = (row.original as any).contact_number || "No contact info"
            const role = (row.original as any).occupation || "Member"
            const rawContact = (row.original as any).contact_number
            const rawEmail = (row.original as any).email
            
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
                    <span className="font-semibold text-foreground text-base truncate">
                      {firstName} {lastName}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground truncate bg-muted px-2 py-0.5 rounded-full">
                        {role}
                      </span>
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
