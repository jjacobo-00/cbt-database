"use client"

import React, { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import {
  CalendarCheck,
  Users,
  CheckCircle2,
  XCircle,
  Search,
  Check,
  RotateCcw,
  Sparkles,
  Save,
  Loader2,
  Calendar,
  Church,
  TrendingUp,
  FileText,
  BarChart3,
  History,
  Layers,
  ChevronRight,
  UserCheck,
  AlertCircle,
  PieChart,
  Sun,
  Moon,
  Clock,
  Trash2,
  Undo2,
  AlertTriangle,
  Edit3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
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
import { toast } from "sonner"
import { cn, formatName } from "@/lib/utils/utils"
import {
  saveAttendanceSession,
  getMinistryAttendanceData,
  getAttendanceHistory,
  deleteAttendanceSession,
} from "./actions"
import {
  getAvailableServiceSlots,
  getDefaultServiceSlot,
  formatServiceSlotBadge,
  ServiceTimeSlot,
} from "@/lib/constants/church-schedule"

type AuthorizedMinistry = {
  id: string
  name: string
  description?: string | null
  leader_id?: string | null
  co_leader_ids?: any
  for_everyone?: boolean
}

type EnrolledMember = {
  id: string
  first_name: string
  middle_name?: string | null
  last_name: string
  suffix?: string | null
  gender?: string | null
  contact_number?: string | null
  church_role?: string | null
  other_ministries?: string[]
  ministries_count?: number
}

type AttendanceSession = {
  id: string
  ministry_id: string
  date: string
  service_time: string
  notes: string
  present_member_ids: string[]
  present_count: number
  total_enrolled: number
  submitted_by_name: string
  last_edited_by_name?: string | null
  updated_at: string
}

export function AttendanceClient({
  authorizedMinistries,
  userRole,
}: {
  authorizedMinistries: AuthorizedMinistry[]
  userRole: "admin" | "member"
}) {
  // Selected Ministry, Date & Service Slot state
  const [selectedMinistryId, setSelectedMinistryId] = useState<string>(
    authorizedMinistries.length > 0 ? authorizedMinistries[0].id : ""
  )

  const getTodayStr = () => new Date().toISOString().split("T")[0]

  const getThisSundayStr = () => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? 0 : 7 - day)
    const sunday = new Date(d.setDate(diff))
    return sunday.toISOString().split("T")[0]
  }

  const getThisWednesdayStr = () => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + 3
    const wed = new Date(d.setDate(diff))
    return wed.toISOString().split("T")[0]
  }

  const getPreviousSundayStr = () => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - (day === 0 ? 7 : day)
    const prevSunday = new Date(d.setDate(diff))
    return prevSunday.toISOString().split("T")[0]
  }

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr())
  const [selectedServiceTime, setSelectedServiceTime] = useState<ServiceTimeSlot>(
    getDefaultServiceSlot(getTodayStr())
  )
  const [activeTab, setActiveTab] = useState<"form" | "history">("form")

  // Handle Date Change: automatically align service slot
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate)
    const availableSlots = getAvailableServiceSlots(newDate)
    const isValidSlot = availableSlots.some((s) => s.value === selectedServiceTime)
    if (!isValidSlot) {
      setSelectedServiceTime(availableSlots[0].value)
    }
  }

  // Attendance Form state
  const [members, setMembers] = useState<EnrolledMember[]>([])
  const [presentMap, setPresentMap] = useState<Record<string, boolean>>({})
  const [initialPresentMap, setInitialPresentMap] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState<string>("")
  const [initialNotes, setInitialNotes] = useState<string>("")
  const [existingSessionInfo, setExistingSessionInfo] = useState<AttendanceSession | null>(null)

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "absent">("all")

  // History & Delete state
  const [historyLogs, setHistoryLogs] = useState<any[]>([])
  const [sessionToDelete, setSessionToDelete] = useState<{
    id: string
    date: string
    schedule: string
  } | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Load Attendance Form Data when Ministry, Date, or Service Time changes
  useEffect(() => {
    if (!selectedMinistryId || !selectedDate || !selectedServiceTime) return

    let isMounted = true
    setIsLoading(true)

    getMinistryAttendanceData(selectedMinistryId, selectedDate, selectedServiceTime)
      .then((res) => {
        if (!isMounted) return
        setMembers(res.members)

        if (res.session) {
          setExistingSessionInfo(res.session)
          setNotes(res.session.notes || "")
          setInitialNotes(res.session.notes || "")
          const map: Record<string, boolean> = {}
          res.session.present_member_ids.forEach((id) => {
            map[id] = true
          })
          setPresentMap(map)
          setInitialPresentMap(map)
        } else {
          setExistingSessionInfo(null)
          setNotes("")
          setInitialNotes("")
          setPresentMap({})
          setInitialPresentMap({})
        }
      })
      .catch((err) => {
        console.error("Error loading attendance data:", err)
        toast.error("Failed to load ministry roster")
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [selectedMinistryId, selectedDate, selectedServiceTime])

  // Load History when history tab is active
  useEffect(() => {
    if (!selectedMinistryId) return
    if (activeTab === "history") {
      getAttendanceHistory(selectedMinistryId).then((data) => setHistoryLogs(data))
    }
  }, [selectedMinistryId, activeTab])

  // Toggle single member present
  const toggleMemberPresent = (memberId: string) => {
    setPresentMap((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }))
  }

  // Quick Action: Select All Present
  const selectAllPresent = () => {
    const map: Record<string, boolean> = {}
    members.forEach((m) => {
      map[m.id] = true
    })
    setPresentMap(map)
    toast.success(`Marked all ${members.length} members present`)
  }

  // Quick Action: Clear All
  const clearAll = () => {
    setPresentMap({})
    toast.info("Cleared present checklist")
  }

  // Revert unsaved edits back to database version
  const handleRevertToSaved = () => {
    if (!existingSessionInfo) return
    setPresentMap({ ...initialPresentMap })
    setNotes(initialNotes)
    toast.info("Reverted changes to last saved session.")
  }

  // Calculated Stats
  const totalEnrolled = members.length
  const presentCount = Object.values(presentMap).filter(Boolean).length
  const absentCount = totalEnrolled - presentCount
  const turnoutRatePct = totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0

  // Live Change Diff when editing
  const addedCount = members.filter((m) => presentMap[m.id] && !initialPresentMap[m.id]).length
  const removedCount = members.filter((m) => !presentMap[m.id] && initialPresentMap[m.id]).length
  const notesChanged = notes !== initialNotes
  const isDirty = Boolean(existingSessionInfo && (addedCount > 0 || removedCount > 0 || notesChanged))

  // Filtered members by search & status pill
  const filteredMembers = members.filter((m) => {
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase()
    const matchesSearch = fullName.includes(searchQuery.toLowerCase())

    const isPresent = Boolean(presentMap[m.id])
    if (statusFilter === "present" && !isPresent) return false
    if (statusFilter === "absent" && isPresent) return false

    return matchesSearch
  })

  // Submit / Update Attendance Handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!selectedMinistryId || !selectedDate) return

    startTransition(async () => {
      try {
        const presentIds = Object.entries(presentMap)
          .filter(([_, isPresent]) => isPresent)
          .map(([id]) => id)

        const isEditing = Boolean(existingSessionInfo)

        const res = await saveAttendanceSession({
          ministryId: selectedMinistryId,
          date: selectedDate,
          serviceTime: selectedServiceTime,
          presentMemberIds: presentIds,
          notes,
        })

        if (res.success) {
          toast.success(
            isEditing
              ? `Attendance changes saved! (${presentIds.length}/${totalEnrolled} Present)`
              : `Attendance submitted successfully! (${presentIds.length}/${totalEnrolled} Present)`
          )
          const updatedSession: AttendanceSession = {
            id: res.data.id,
            ministry_id: res.data.ministry_id,
            date: res.data.date,
            service_time: res.data.service_time || selectedServiceTime,
            notes: res.data.notes || "",
            present_member_ids: presentIds,
            present_count: presentIds.length,
            total_enrolled: totalEnrolled,
            submitted_by_name: res.data.submitted_by_name || existingSessionInfo?.submitted_by_name || "You",
            last_edited_by_name: res.data.last_edited_by_name || "You",
            updated_at: new Date().toISOString(),
          }
          setExistingSessionInfo(updatedSession)
          setInitialPresentMap({ ...presentMap })
          setInitialNotes(notes)

          // Refresh history logs and navigate back to Session History if this was an edit
          getAttendanceHistory(selectedMinistryId).then((data) => setHistoryLogs(data))
          if (isEditing) {
            setActiveTab("history")
          }
        }
      } catch (err: any) {
        console.error("Attendance submission failed:", err)
        toast.error(err.message || "Failed to save attendance session.")
      }
    })
  }

  // Delete Attendance Session Handler
  const handleDeleteSession = async () => {
    if (!sessionToDelete) return
    const targetId = sessionToDelete.id
    setSessionToDelete(null)

    startTransition(async () => {
      try {
        const res = await deleteAttendanceSession(targetId)
        if (res.success) {
          toast.success("Attendance session deleted successfully.")
          if (existingSessionInfo?.id === targetId) {
            setExistingSessionInfo(null)
            setNotes("")
            setInitialNotes("")
            setPresentMap({})
            setInitialPresentMap({})
          }
          if (selectedMinistryId) {
            getAttendanceHistory(selectedMinistryId).then((data) => setHistoryLogs(data))
          }
        }
      } catch (err: any) {
        console.error("Error deleting session:", err)
        toast.error(err.message || "Failed to delete attendance session.")
      }
    })
  }

  const selectedMinistry = authorizedMinistries.find((m) => m.id === selectedMinistryId)

  if (authorizedMinistries.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 text-center p-8 rounded-2xl border bg-card shadow-sm space-y-4">
        <div className="h-16 w-16 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">No Ministry Access Granted</h2>
        <p className="text-sm text-muted-foreground">
          You are currently not assigned as a Leader or Co-Leader of an active ministry. Contact your church administrator to request attendance leader permissions.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-40 sm:pb-8">
      {/* 🟢 Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-5 rounded-2xl border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Ministry Attendance</h1>
            {userRole === "admin" && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                Admin Mode
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Record, edit, and analyze member turnout for church ministries across Sunday & Wednesday services.
          </p>
        </div>

        {/* Controls: Ministry Select, Date Picker & Service Slot */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Ministry Switcher */}
          <div className="grid gap-1 min-w-[180px] flex-1 sm:flex-initial">
            <Label className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
              <Church className="h-3.5 w-3.5 text-primary" /> Active Ministry
            </Label>
            <select
              value={selectedMinistryId}
              onChange={(e) => setSelectedMinistryId(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background text-foreground px-3 font-semibold text-sm focus:ring-2 focus:ring-primary shadow-xs"
            >
              {authorizedMinistries.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker & Quick Buttons */}
          <div className="grid gap-1 flex-1 sm:flex-initial">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Attendance Date
              </Label>
              <div className="flex items-center gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => handleDateChange(getTodayStr())}
                  className={cn(
                    "hover:underline font-semibold",
                    selectedDate === getTodayStr() ? "text-primary font-bold" : "text-muted-foreground"
                  )}
                >
                  Today
                </button>
                <span className="text-muted-foreground">•</span>
                <button
                  type="button"
                  onClick={() => {
                    handleDateChange(getThisSundayStr())
                    setSelectedServiceTime("AM")
                  }}
                  className={cn(
                    "hover:underline font-semibold",
                    selectedDate === getThisSundayStr() && selectedServiceTime === "AM"
                      ? "text-primary font-bold"
                      : "text-muted-foreground"
                  )}
                >
                  Sunday AM
                </button>
                <span className="text-muted-foreground">•</span>
                <button
                  type="button"
                  onClick={() => {
                    handleDateChange(getThisSundayStr())
                    setSelectedServiceTime("PM")
                  }}
                  className={cn(
                    "hover:underline font-semibold",
                    selectedDate === getThisSundayStr() && selectedServiceTime === "PM"
                      ? "text-primary font-bold"
                      : "text-muted-foreground"
                  )}
                >
                  Sunday PM
                </button>
                <span className="text-muted-foreground">•</span>
                <button
                  type="button"
                  onClick={() => {
                    handleDateChange(getThisWednesdayStr())
                    setSelectedServiceTime("PM")
                  }}
                  className={cn(
                    "hover:underline font-semibold",
                    selectedDate === getThisWednesdayStr()
                      ? "text-primary font-bold"
                      : "text-muted-foreground"
                  )}
                >
                  Wednesday
                </button>
              </div>
            </div>
            <DatePicker
              value={selectedDate}
              onChange={(val) => handleDateChange(val || getTodayStr())}
              className="h-10 min-w-[150px]"
            />
          </div>

          {/* ☀️ / 🌙 Service Schedule Slot Selector */}
          <div className="grid gap-1 min-w-[160px] flex-1 sm:flex-initial">
            <Label className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-primary" /> Service Schedule
            </Label>
            <div className="flex items-center bg-muted/60 p-1 rounded-xl h-10 border border-input shadow-xs">
              {getAvailableServiceSlots(selectedDate).map((slot) => {
                const isSelected = selectedServiceTime === slot.value
                const Icon = slot.icon === "sun" ? Sun : Moon

                return (
                  <button
                    key={slot.value}
                    type="button"
                    onClick={() => setSelectedServiceTime(slot.value)}
                    className={cn(
                      "flex-1 h-full rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 px-3 select-none",
                      isSelected
                        ? "bg-background text-primary shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5",
                        isSelected
                          ? slot.icon === "sun"
                            ? "text-amber-500 fill-amber-500/20"
                            : "text-indigo-500 fill-indigo-500/20"
                          : "opacity-70"
                      )}
                    />
                    <span>{slot.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 📊 Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className="grid w-full grid-cols-2 max-w-xs bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="form" className="rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <UserCheck className="h-4 w-4" /> Take Attendance
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <History className="h-4 w-4" /> Session History
            </TabsTrigger>
          </TabsList>

          <Link
            href="/reports"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 transition-colors w-fit"
          >
            <PieChart className="h-3.5 w-3.5" /> View Church Attendance Reports & CSV Exports <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: TAKE ATTENDANCE FORM */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="form" className="space-y-5 mt-4">
          {/* KPI Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card className="shadow-xs bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Roster</p>
                  <p className="text-2xl font-bold text-foreground">{totalEnrolled}</p>
                </div>
                <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">Present</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{presentCount}</p>
                </div>
                <div className="h-10 w-10 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs bg-amber-500/5 border-amber-500/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">Absent</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{absentCount}</p>
                </div>
                <div className="h-10 w-10 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
                  <XCircle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xs bg-card col-span-2 md:col-span-1">
              <CardContent className="p-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Turnout Rate</span>
                  <span className="font-bold text-primary">{turnoutRatePct}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${turnoutRatePct}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Target: 80%+ Turnout</p>
              </CardContent>
            </Card>
          </div>

          {/* 🌟 EDIT MODE BANNER (Shown when viewing an existing submitted session) */}
          {existingSessionInfo && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 dark:bg-amber-500/15 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white shadow-xs flex items-center gap-1">
                    <Edit3 className="h-3 w-3" /> Edit Mode
                  </span>
                  <span className="font-bold text-foreground">
                    {selectedDate} • {formatServiceSlotBadge(selectedDate, selectedServiceTime).label}
                  </span>
                  {isDirty && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      Unsaved Changes ({addedCount > 0 ? `+${addedCount} present` : ""}
                      {removedCount > 0 ? ` -${removedCount} absent` : ""}
                      {notesChanged ? " • notes modified" : ""})
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground">
                  Submitted by <strong className="text-foreground">{existingSessionInfo.submitted_by_name}</strong>
                  {existingSessionInfo.last_edited_by_name &&
                    existingSessionInfo.last_edited_by_name !== existingSessionInfo.submitted_by_name && (
                      <>
                        {" "}• Last edited by{" "}
                        <strong className="text-foreground">{existingSessionInfo.last_edited_by_name}</strong>
                      </>
                    )}
                  {" "}on {new Date(existingSessionInfo.updated_at).toLocaleDateString([], { month: "short", day: "numeric" })} at{" "}
                  {new Date(existingSessionInfo.updated_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isDirty && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRevertToSaved}
                    className="h-8 text-xs gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                  >
                    <Undo2 className="h-3.5 w-3.5" /> Revert
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSessionToDelete({
                      id: existingSessionInfo.id,
                      date: existingSessionInfo.date,
                      schedule: formatServiceSlotBadge(
                        existingSessionInfo.date,
                        existingSessionInfo.service_time
                      ).label,
                    })
                  }
                  className="h-8 text-xs text-destructive hover:bg-destructive/10 gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          )}

          {/* Toolbar & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member by name..."
                className="pl-9 h-10 bg-background"
              />
            </div>

            {/* Filter Pills & Quick Actions */}
            <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
              {/* Filter Pills */}
              <div className="flex items-center bg-muted/60 p-1 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all",
                    statusFilter === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                  )}
                >
                  All ({totalEnrolled})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("present")}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all",
                    statusFilter === "present" ? "bg-emerald-500 text-white shadow-xs" : "text-muted-foreground"
                  )}
                >
                  Present ({presentCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("absent")}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all",
                    statusFilter === "absent" ? "bg-amber-500 text-white shadow-xs" : "text-muted-foreground"
                  )}
                >
                  Absent ({absentCount})
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllPresent}
                  className="h-9 text-xs gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                >
                  <Check className="h-3.5 w-3.5" /> All Present
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="h-9 text-xs text-muted-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Clear
                </Button>
              </div>
            </div>
          </div>

          {/* Member Roster Card Checklist */}
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm font-medium">Loading roster for {selectedMinistry?.name}...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-12 text-center border rounded-xl bg-card space-y-2">
              <Users className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="font-semibold text-foreground">No members found</p>
              <p className="text-xs text-muted-foreground">
                {searchQuery
                  ? "No member matches your search filter."
                  : "No members are currently enrolled in this ministry."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredMembers.map((m) => {
                const isPresent = Boolean(presentMap[m.id])
                const initials = `${m.first_name?.[0] || ""}${m.last_name?.[0] || ""}`.toUpperCase()

                return (
                  <div
                    key={m.id}
                    onClick={() => toggleMemberPresent(m.id)}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 shadow-xs",
                      isPresent
                        ? "bg-emerald-500/10 border-emerald-500/40 dark:bg-emerald-500/15"
                        : "bg-card hover:bg-muted/40 border-border"
                    )}
                  >
                    {/* Member Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar initials */}
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border",
                          isPresent
                            ? "bg-emerald-500 text-white border-emerald-600 shadow-xs"
                            : "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        {initials}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {formatName(`${m.last_name}, ${m.first_name}`)}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {m.church_role && (
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {m.church_role}
                            </span>
                          )}
                          {m.other_ministries && m.other_ministries.length > 0 && (
                            <span className="text-[10px] text-primary/80 bg-primary/10 px-1.5 py-0.2 rounded font-medium truncate max-w-[120px]">
                              +{m.other_ministries.length} other{m.other_ministries.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Checkbox Indicator */}
                    <div
                      className={cn(
                        "h-6 w-6 rounded-lg flex items-center justify-center transition-all shrink-0 border",
                        isPresent
                          ? "bg-emerald-500 text-white border-emerald-600 shadow-xs"
                          : "border-input bg-background"
                      )}
                    >
                      {isPresent && <Check className="h-4 w-4 stroke-[3]" />}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Session Notes */}
          <Card className="shadow-xs bg-card">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Session Notes & Topic
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Sunday Fellowship - Topic: Walking by Faith"
                className="h-10 text-xs bg-background"
              />
            </CardContent>
          </Card>

          {/* Always-Visible In-Page Submit / Save Section */}
          <div className="p-4 rounded-2xl border bg-card/80 backdrop-blur-xs shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-foreground">Turnout Summary</p>
                {existingSessionInfo && (
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                    Edit Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                <strong className="text-primary font-bold">
                  {presentCount} of {totalEnrolled}
                </strong>{" "}
                members marked present ({turnoutRatePct}% turnout).
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isDirty && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRevertToSaved}
                  className="h-12 px-4 rounded-xl text-xs font-semibold gap-1.5"
                >
                  <Undo2 className="h-4 w-4" /> Revert
                </Button>
              )}
              <Button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isPending || isLoading}
                className={cn(
                  "h-12 flex-1 sm:flex-initial px-8 rounded-xl font-bold text-sm shadow-md gap-2 active:scale-[0.98] transition-transform",
                  existingSessionInfo
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "bg-primary text-primary-foreground"
                )}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {existingSessionInfo
                  ? `Save Changes (${presentCount}/${totalEnrolled})`
                  : `Submit Attendance (${presentCount}/${totalEnrolled})`}
              </Button>
            </div>
          </div>

          {/* 📱 STICKY MOBILE ACTION BAR (Floats directly above the h-16 MobileBottomNav) */}
          <div className="sm:hidden fixed bottom-16 inset-x-0 z-30 p-3 bg-background/95 backdrop-blur-md border-t shadow-2xl flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">
                {existingSessionInfo ? "Editing Roster" : "Turnout Roster"}
              </p>
              <p className="text-sm font-bold text-primary">
                {presentCount} / {totalEnrolled}{" "}
                <span className="text-[11px] font-semibold text-muted-foreground">
                  ({turnoutRatePct}%)
                </span>
              </p>
            </div>
            <Button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isPending || isLoading}
              className={cn(
                "h-10 px-5 rounded-xl font-bold text-xs shadow-md gap-1.5 active:scale-95 transition-transform",
                existingSessionInfo
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {existingSessionInfo ? "Save Changes" : "Submit"}
            </Button>
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: ATTENDANCE HISTORY LOG */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Attendance Log History
              </CardTitle>
              <CardDescription>Past sessions recorded for {selectedMinistry?.name}</CardDescription>
            </CardHeader>
            <CardContent>
              {historyLogs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  No attendance history logged yet for this ministry.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {historyLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl border bg-card flex items-center justify-between gap-4 text-sm shadow-xs hover:border-primary/30 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground">{log.date}</span>
                          {/* Service Schedule Slot Badge */}
                          {(() => {
                            const badge = formatServiceSlotBadge(log.date, log.service_time)
                            const Icon = badge.icon === "sun" ? Sun : Moon
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                                <Icon className="h-3 w-3" /> {badge.label}
                              </span>
                            )
                          })()}
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                              log.rate_pct >= 80
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            )}
                          >
                            {log.rate_pct}% Turnout
                          </span>
                        </div>
                        {log.notes && <p className="text-xs text-muted-foreground italic">{log.notes}</p>}
                        <p className="text-[11px] text-muted-foreground">
                          Submitted by <strong className="text-foreground">{log.submitted_by_name || "Leader"}</strong>
                          {log.last_edited_by_name && log.last_edited_by_name !== log.submitted_by_name && (
                            <> • Edited by <strong className="text-foreground">{log.last_edited_by_name}</strong></>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="text-right mr-1">
                          <p className="font-bold text-primary">
                            {log.present_count} / {log.total_enrolled}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Present</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleDateChange(log.date)
                            setSelectedServiceTime(log.service_time || "AM")
                            setActiveTab("form")
                            toast.info(`Editing attendance for ${log.date} (${log.service_time})`)
                          }}
                          className="h-8 text-xs text-primary gap-1 border-primary/20 hover:bg-primary/10"
                        >
                          <Edit3 className="h-3 w-3" /> Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setSessionToDelete({
                              id: log.id,
                              date: log.date,
                              schedule: formatServiceSlotBadge(log.date, log.service_time).label,
                            })
                          }
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ⚠️ Delete Confirmation Dialog */}
      <AlertDialog
        open={Boolean(sessionToDelete)}
        onOpenChange={(open) => !open && setSessionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Delete Attendance Record?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the attendance record for{" "}
              <strong>{sessionToDelete?.date}</strong> (
              <strong>{sessionToDelete?.schedule}</strong>)? This action cannot be undone and will
              remove this session from church attendance reports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
            >
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
