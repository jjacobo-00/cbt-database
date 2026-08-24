"use client"

import Link from "next/link"
import { useState, useMemo } from "react"
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  User,
  Calendar,
  MoreHorizontal,
  Church,
  Sprout,
  Users,
  ShieldCheck,
  Award,
  Sparkles,
  Search,
  Check,
  ChevronDown,
  X,
  UserCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "sonner"
import { createMission, updateMission, deleteMission } from "./actions"
import { cn, formatName, formatFullName, formatSuffix } from "@/lib/utils/utils"

export type MemberOption = {
  id: string
  first_name: string
  middle_name?: string | null
  last_name: string
  suffix?: string | null
  church_role?: string | null
  gender?: string | null
}

export type Mission = {
  id: string
  name: string
  location: string | null
  pastor_id?: string | null
  pastor_name: string | null
  pastor_start_date?: string | null
  established_date: string | null
  organized_date?: string | null
  status?: string | null // 'mission_outreach' | 'organized_church'
  member_count?: number
}

// Utility function to calculate tenure in full years
function calculateTenure(dateString?: string | null): { years: number; text: string } | null {
  if (!dateString) return null
  const start = new Date(dateString)
  if (isNaN(start.getTime())) return null
  const now = new Date()
  let years = now.getFullYear() - start.getFullYear()
  const monthDiff = now.getMonth() - start.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < start.getDate())) {
    years--
  }
  if (years < 0) return null
  if (years === 0) return { years: 0, text: "<1 yr" }
  if (years === 1) return { years: 1, text: "1 yr" }
  return { years, text: `${years} yrs` }
}

export function MissionsClient({
  initialMissions,
  members,
}: {
  initialMissions: Mission[]
  members: MemberOption[]
}) {
  const [missions, setMissions] = useState<Mission[]>(initialMissions)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "outreach" | "organized">("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const DRAFT_KEY = "cbt_mission_form_draft"
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false)

  // Designated Pastor Combobox States
  const [pastorSelectorOpen, setPastorSelectorOpen] = useState(false)
  const [pastorSearchQuery, setPastorSearchQuery] = useState("")
  const [pastorFilterMode, setPastorFilterMode] = useState<"pastors" | "all">("pastors")

  const [formData, setFormData] = useState<{
    id?: string
    name: string
    location: string
    pastor_id: string
    pastor_name: string
    established_date: string
    organized_date: string
    status: string
  }>({
    name: "",
    location: "",
    pastor_id: "",
    pastor_name: "",
    established_date: "",
    organized_date: "",
    status: "mission_outreach",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mission Pastors Roster
  const missionPastors = useMemo(() => {
    return members.filter(
      (m) =>
        m.church_role === "Mission Pastor" ||
        m.church_role === "Main Pastor" ||
        missions.some((ms) => ms.pastor_id === m.id)
    )
  }, [members, missions])

  // Filtered list based on active mode and search query
  const displayedPastorCandidates = useMemo(() => {
    const baseList =
      pastorFilterMode === "pastors" && missionPastors.length > 0
        ? missionPastors
        : members

    if (!pastorSearchQuery.trim()) return baseList

    const q = pastorSearchQuery.toLowerCase()
    return baseList.filter((m) =>
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) ||
      (m.church_role && m.church_role.toLowerCase().includes(q))
    )
  }, [pastorFilterMode, missionPastors, members, pastorSearchQuery])

  // Local draft sync for new mission
  const setFormAndDraft = (updater: (prev: typeof formData) => typeof formData) => {
    setFormData((prev) => {
      const next = updater(prev)
      if (!next.id && typeof window !== "undefined") {
        const hasContent = next.name || next.location || next.pastor_id || next.established_date || next.organized_date
        if (hasContent) {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(next))
        } else {
          localStorage.removeItem(DRAFT_KEY)
        }
      }
      return next
    })
  }

  const clearDraft = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(DRAFT_KEY)
    }
    setHasRestoredDraft(false)
    setFormData({
      name: "",
      location: "",
      pastor_id: "",
      pastor_name: "",
      established_date: "",
      organized_date: "",
      status: "mission_outreach",
    })
    toast.info("Mission draft cleared")
  }

  // Derived KPI Stats
  const totalMissions = missions.length
  const organizedCount = missions.filter(
    (m) => m.status === "organized_church" || Boolean(m.organized_date)
  ).length
  const outreachCount = totalMissions - organizedCount
  const totalOutreachMembers = missions.reduce((acc, m) => acc + (m.member_count || 0), 0)

  // Filtered dataset by search & active tab
  const filteredMissions = missions.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.location && m.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.pastor_name && m.pastor_name.toLowerCase().includes(searchQuery.toLowerCase()))

    const isOrganized = m.status === "organized_church" || Boolean(m.organized_date)
    if (activeTab === "outreach" && isOrganized) return false
    if (activeTab === "organized" && !isOrganized) return false

    return matchesSearch
  })

  const openAddModal = () => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setFormData({ ...parsed, id: undefined })
          setHasRestoredDraft(true)
          setIsModalOpen(true)
          return
        } catch {
          // ignore error
        }
      }
    }
    setHasRestoredDraft(false)
    setFormData({
      name: "",
      location: "",
      pastor_id: "",
      pastor_name: "",
      established_date: "",
      organized_date: "",
      status: "mission_outreach",
    })
    setIsModalOpen(true)
  }

  const openEditModal = (mission: Mission) => {
    setHasRestoredDraft(false)
    const isOrganized = mission.status === "organized_church" || Boolean(mission.organized_date)
    setFormData({
      id: mission.id,
      name: mission.name,
      location: mission.location || "",
      pastor_id: mission.pastor_id || "",
      pastor_name: mission.pastor_name || "",
      established_date: mission.established_date || "",
      organized_date: mission.organized_date || "",
      status: isOrganized ? "organized_church" : "mission_outreach",
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (formData.id) {
        const res = await updateMission(formData.id, formData)
        if (res.success && res.data) {
          setMissions(
            missions.map((m) => (m.id === formData.id ? ({ ...m, ...res.data } as Mission) : m))
          )
          toast.success("Mission updated successfully")
          setIsModalOpen(false)
        } else {
          toast.error(res.error || "Failed to update mission")
        }
      } else {
        const res = await createMission(formData)
        if (res.success && res.data) {
          if (typeof window !== "undefined") {
            localStorage.removeItem(DRAFT_KEY)
          }
          setHasRestoredDraft(false)
          setMissions(
            [...missions, { ...res.data, member_count: 0 } as Mission].sort((a, b) =>
              a.name.localeCompare(b.name)
            )
          )
          toast.success("Mission added successfully")
          setIsModalOpen(false)
        } else {
          toast.error(res.error || "Failed to add mission")
        }
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!isDeletingId) return

    const res = await deleteMission(isDeletingId)
    if (res.success) {
      setMissions(missions.filter((m) => m.id !== isDeletingId))
      toast.success("Mission deleted successfully")
    } else {
      toast.error(res.error || "Failed to delete mission")
    }
    setIsDeletingId(null)
  }

  return (
    <div className="space-y-6 pb-8">
      {/* 📊 Hero KPI Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-t-4 border-t-blue-500 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mission Work</CardTitle>
            <div className="h-8 w-8 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Church className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalMissions}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Churches & outreaches total
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-amber-500 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mission Outreaches</CardTitle>
            <div className="h-8 w-8 bg-amber-500/10 rounded-full flex items-center justify-center">
              <Sprout className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{outreachCount}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Active church plants growing
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-emerald-500 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organized Churches</CardTitle>
            <div className="h-8 w-8 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{organizedCount}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Chartered self-governing churches
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-purple-500 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outreach Members</CardTitle>
            <div className="h-8 w-8 bg-purple-500/10 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalOutreachMembers}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Congregation across missions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 🔍 Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <Input
            placeholder="Search by mission name, location, or pastor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md bg-card"
          />
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as any)}
            className="w-full sm:w-auto"
          >
            <TabsList>
              <TabsTrigger value="all">All ({totalMissions})</TabsTrigger>
              <TabsTrigger value="outreach">Outreaches ({outreachCount})</TabsTrigger>
              <TabsTrigger value="organized">Organized ({organizedCount})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Button onClick={openAddModal} className="shrink-0 shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Add Mission Church
        </Button>
      </div>

      {/* 📌 Mission Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMissions.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center text-muted-foreground bg-card border border-dashed rounded-xl shadow-sm">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">No mission churches found</h3>
            <p className="text-sm max-w-sm">
              There are no mission churches matching your search criteria. Try clearing search or add a new mission.
            </p>
          </div>
        ) : (
          filteredMissions.map((mission) => {
            const isOrganized =
              mission.status === "organized_church" || Boolean(mission.organized_date)
            const churchTenure = calculateTenure(mission.established_date)
            const organizedTenure = calculateTenure(mission.organized_date)
            const pastorTenure = calculateTenure(mission.pastor_start_date)

            return (
              <Card
                key={mission.id}
                className="relative group overflow-hidden shadow-sm hover:shadow-md transition-all border-l-4 border-l-primary/80"
              >
                <CardHeader className="pb-3 pr-10">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {/* Status Badge */}
                    {isOrganized ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <ShieldCheck className="h-3 w-3" /> Organized Church
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Sprout className="h-3 w-3" /> Mission Outreach
                      </span>
                    )}

                    {/* Church Age Pill */}
                    {churchTenure && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        🌿 {churchTenure.text} active
                      </span>
                    )}

                    {/* Organized Tenure Pill (CONDITIONAL: ONLY SHOWN IF ORGANIZED DATE EXISTS) */}
                    {isOrganized && organizedTenure && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        🏛️ {organizedTenure.text} organized
                      </span>
                    )}
                  </div>

                  <CardTitle className="text-xl line-clamp-1">{mission.name}</CardTitle>

                  <div className="absolute top-4 right-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            setTimeout(() => openEditModal(mission), 0);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            setTimeout(() => setIsDeletingId(mission.id), 0);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2.5 pb-4 text-sm">
                  {/* Location */}
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 text-primary/70 shrink-0" />
                    <span className="line-clamp-2">{mission.location || "No location specified"}</span>
                  </div>

                  {/* Pastor & Pastor Tenure Pill */}
                  <div className="flex items-center justify-between gap-2 text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary/70 shrink-0" />
                      {mission.pastor_id ? (
                        <Link href={`/members/${mission.pastor_id}`} className="font-semibold text-primary hover:underline">
                          {mission.pastor_name}
                        </Link>
                      ) : (
                        <span className="font-medium text-foreground">
                          {mission.pastor_name || "No designated pastor"}
                        </span>
                      )}
                    </div>

                    {/* Pastor Tenure Pill (CONDITIONAL: ONLY SHOWN IF PASTOR START DATE EXISTS) */}
                    {pastorTenure && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        👤 Pastor for {pastorTenure.text}
                      </span>
                    )}
                  </div>

                  {/* Dates Breakdown */}
                  <div className="pt-2 space-y-1 text-xs text-muted-foreground border-t border-border/50">
                    {mission.established_date && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" /> Established:
                        </span>
                        <span className="font-medium text-foreground">
                          {new Date(mission.established_date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    )}

                    {/* CONDITIONAL ORGANIZED DATE DISPLAY */}
                    {isOrganized && mission.organized_date && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Award className="h-3.5 w-3.5 text-blue-500" /> Organized:
                        </span>
                        <span className="font-medium text-foreground">
                          {new Date(mission.organized_date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer Stats & Direct Link */}
                  <div className="pt-3 border-t flex items-center justify-between">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-full">
                      {mission.member_count || 0} Members
                    </span>
                    <a
                      href={`/members?search=${encodeURIComponent(mission.name)}`}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      View Members →
                    </a>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* 📝 Add/Edit Mission Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="sm:max-w-[480px]"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{formData.id ? "Edit Mission Church" : "Add Mission Church"}</DialogTitle>
            <DialogDescription>
              {formData.id
                ? "Update location, designated pastor, and status for this mission."
                : "Enter details for the new mission church plant."}
            </DialogDescription>
          </DialogHeader>

          {/* Local Draft Restored Banner */}
          {hasRestoredDraft && !formData.id && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs animate-in fade-in duration-200">
              <span className="text-primary font-medium flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 shrink-0" /> Draft restored from previous session
              </span>
              <button
                type="button"
                onClick={clearDraft}
                className="text-muted-foreground hover:text-destructive underline text-[11px] font-semibold"
              >
                Clear Draft
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Mission Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormAndDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. CBT Olongapo - Annex"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Church Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormAndDraft((prev) => ({ ...prev, status: e.target.value }))}
                className="h-10 rounded-lg border border-input bg-card text-foreground px-3 w-full font-medium text-sm"
              >
                <option value="mission_outreach">🌿 Mission Outreach (Church Plant)</option>
                <option value="organized_church">🏛️ Organized Church (Chartered Independent)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location / Address</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormAndDraft((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Subic, Zambales"
              />
            </div>

            {/* 👤 Designated Pastor Searchable Combobox */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="pastor_id">Designated Pastor</Label>
                {missionPastors.length > 0 && (
                  <span className="text-[11px] text-primary font-medium">
                    {missionPastors.length} Mission Pastor{missionPastors.length === 1 ? "" : "s"} available
                  </span>
                )}
              </div>

              {formData.pastor_id ? (
                <div className="flex items-center justify-between p-3 rounded-xl border bg-primary/5 border-primary/20 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {formData.pastor_name
                        ? formData.pastor_name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()
                        : "P"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{formData.pastor_name}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <UserCheck className="h-3 w-3 text-primary" /> Designated Pastor
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormAndDraft((prev) => ({
                        ...prev,
                        pastor_id: "",
                        pastor_name: "",
                      }))
                    }}
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1 font-medium"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </Button>
                </div>
              ) : (
                <Popover open={pastorSelectorOpen} onOpenChange={setPastorSelectorOpen} modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between h-11 px-3 text-left font-normal bg-card"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPastorSelectorOpen(true)
                      }}
                    >
                      <span className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                        <User className="h-4 w-4 text-primary shrink-0" />
                        Search & Select Designated Pastor...
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[340px] sm:w-[420px] p-2 z-[9999] shadow-2xl rounded-2xl border bg-popover text-popover-foreground"
                    align="start"
                    side="bottom"
                    sideOffset={6}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Filter Mode Pills: Mission Pastors vs All Members */}
                    <div className="flex items-center justify-between p-1 bg-muted/60 rounded-xl text-xs mb-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPastorFilterMode("pastors")
                        }}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all text-center",
                          pastorFilterMode === "pastors"
                            ? "bg-background text-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Mission Pastors ({missionPastors.length})
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPastorFilterMode("all")
                        }}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all text-center",
                          pastorFilterMode === "all"
                            ? "bg-background text-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        All Members ({members.length})
                      </button>
                    </div>

                    {/* Live Search Input */}
                    <div className="relative mb-2 px-1">
                      <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={pastorSearchQuery}
                        onChange={(e) => setPastorSearchQuery(e.target.value)}
                        placeholder="Search pastor by name..."
                        className="pl-9 h-10 bg-background text-xs sm:text-sm font-medium"
                        autoFocus
                      />
                    </div>

                    {/* Candidates List */}
                    <div className="max-h-[220px] overflow-y-auto space-y-1 p-1">
                      {displayedPastorCandidates.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground space-y-1">
                          <p className="font-semibold text-foreground">No pastors found</p>
                          <p className="text-[11px]">Try switching to &quot;All Members&quot; or check search query.</p>
                        </div>
                      ) : (
                        displayedPastorCandidates.map((m) => {
                          const initials = `${m.first_name?.[0] || ""}${m.last_name?.[0] || ""}`.toUpperCase()
                          const isSelected = formData.pastor_id === m.id
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFormAndDraft((prev) => ({
                                  ...prev,
                                  pastor_id: m.id,
                                  pastor_name: formatFullName(m),
                                }))
                                setPastorSelectorOpen(false)
                                setPastorSearchQuery("")
                              }}
                              className={cn(
                                "w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between gap-2 border select-none",
                                isSelected
                                  ? "bg-primary/10 border-primary text-primary font-semibold"
                                  : "bg-card hover:bg-muted/60 border-transparent text-foreground"
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-xs sm:text-sm font-semibold truncate">
                                      {formatName(`${m.first_name} ${m.last_name}`)}
                                    </p>
                                    {m.suffix && (
                                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary/15 text-primary border border-primary/30 shrink-0">
                                        {formatSuffix(m.suffix)}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    {m.church_role || "Member"}
                                  </p>
                                </div>
                              </div>
                              {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                            </button>
                          )
                        })
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              <p className="text-[11px] text-muted-foreground">
                Selecting a pastor dynamically links their personal profile & tenure to this mission branch.
              </p>
            </div>

            {/* Established Date */}
            <div className="space-y-2">
              <Label htmlFor="established_date">Established Date (Church Plant Started)</Label>
              <DatePicker
                value={formData.established_date}
                onChange={(val) => setFormAndDraft((prev) => ({ ...prev, established_date: val || "" }))}
                placeholder="Select establishment date"
                className="h-10 w-full"
              />
            </div>

            {/* Organized Date (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="organized_date">
                Organized Date <span className="text-xs text-muted-foreground">(Optional)</span>
              </Label>
              <DatePicker
                value={formData.organized_date}
                onChange={(val) => setFormAndDraft((prev) => ({ ...prev, organized_date: val || "" }))}
                placeholder="Select charter/organized date"
                className="h-10 w-full"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty if church is still an unorganized mission outreach.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Mission"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!isDeletingId} onOpenChange={(open) => !open && setIsDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this mission church record from the database. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
