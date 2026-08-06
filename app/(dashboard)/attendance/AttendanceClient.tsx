"use client"

import React, { useState, useEffect, useTransition } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "sonner"
import { cn, formatName } from "@/lib/utils/utils"
import { saveAttendanceSession, getMinistryAttendanceData, getAttendanceHistory, getAttendanceAnalytics } from "./actions"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

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
  notes: string
  present_member_ids: string[]
  present_count: number
  total_enrolled: number
  submitted_by_name: string
  updated_at: string
}

export function AttendanceClient({
  authorizedMinistries,
  userRole,
}: {
  authorizedMinistries: AuthorizedMinistry[]
  userRole: "admin" | "member"
}) {
  // Selected Ministry & Date state
  const [selectedMinistryId, setSelectedMinistryId] = useState<string>(
    authorizedMinistries.length > 0 ? authorizedMinistries[0].id : ""
  )

  const getTodayStr = () => new Date().toISOString().split("T")[0]

  const getPreviousSundayStr = () => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day
    const prevSunday = new Date(d.setDate(diff))
    return prevSunday.toISOString().split("T")[0]
  }

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr())
  const [activeTab, setActiveTab] = useState<"form" | "history" | "analytics">("form")

  // Attendance Form state
  const [members, setMembers] = useState<EnrolledMember[]>([])
  const [presentMap, setPresentMap] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState<string>("")
  const [existingSessionInfo, setExistingSessionInfo] = useState<AttendanceSession | null>(null)

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "absent">("all")

  // History & Analytics state
  const [historyLogs, setHistoryLogs] = useState<any[]>([])
  const [analyticsData, setAnalyticsData] = useState<any>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Load Attendance Form Data when Ministry or Date changes
  useEffect(() => {
    if (!selectedMinistryId || !selectedDate) return

    let isMounted = true
    setIsLoading(true)

    getMinistryAttendanceData(selectedMinistryId, selectedDate)
      .then((res) => {
        if (!isMounted) return
        setMembers(res.members)

        if (res.session) {
          setExistingSessionInfo(res.session)
          setNotes(res.session.notes || "")
          const map: Record<string, boolean> = {}
          res.session.present_member_ids.forEach((id) => {
            map[id] = true
          })
          setPresentMap(map)
        } else {
          setExistingSessionInfo(null)
          setNotes("")
          setPresentMap({})
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
  }, [selectedMinistryId, selectedDate])

  // Load History & Analytics when tabs switch
  useEffect(() => {
    if (!selectedMinistryId) return

    if (activeTab === "history") {
      getAttendanceHistory(selectedMinistryId).then((data) => setHistoryLogs(data))
    } else if (activeTab === "analytics") {
      getAttendanceAnalytics(selectedMinistryId).then((data) => setAnalyticsData(data))
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

  // Calculated Stats
  const totalEnrolled = members.length
  const presentCount = Object.values(presentMap).filter(Boolean).length
  const absentCount = totalEnrolled - presentCount
  const turnoutRatePct = totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0

  // Filtered members by search & status pill
  const filteredMembers = members.filter((m) => {
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase()
    const matchesSearch = fullName.includes(searchQuery.toLowerCase())

    const isPresent = Boolean(presentMap[m.id])
    if (statusFilter === "present" && !isPresent) return false
    if (statusFilter === "absent" && isPresent) return false

    return matchesSearch
  })

  // Submit Attendance Handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!selectedMinistryId || !selectedDate) return

    startTransition(async () => {
      try {
        const presentIds = Object.entries(presentMap)
          .filter(([_, isPresent]) => isPresent)
          .map(([id]) => id)

        const res = await saveAttendanceSession({
          ministryId: selectedMinistryId,
          date: selectedDate,
          presentMemberIds: presentIds,
          notes,
        })

        if (res.success) {
          toast.success(`Attendance saved successfully! (${presentIds.length}/${totalEnrolled} Present)`)
          setExistingSessionInfo({
            id: res.data.id,
            ministry_id: res.data.ministry_id,
            date: res.data.date,
            notes: res.data.notes || "",
            present_member_ids: presentIds,
            present_count: presentIds.length,
            total_enrolled: totalEnrolled,
            submitted_by_name: res.data.submitted_by_name || "You",
            updated_at: new Date().toISOString(),
          })
        }
      } catch (err: any) {
        console.error("Attendance submission failed:", err)
        toast.error(err.message || "Failed to save attendance session.")
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
    <div className="space-y-6 pb-24 sm:pb-8">
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
            Record, track, and analyze member turnout for church ministries.
          </p>
        </div>

        {/* Controls: Ministry Select & Date Picker */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Ministry Switcher */}
          <div className="grid gap-1 min-w-[200px] flex-1 sm:flex-initial">
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
                  onClick={() => setSelectedDate(getTodayStr())}
                  className={cn(
                    "hover:underline font-semibold",
                    selectedDate === getTodayStr() ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  Today
                </button>
                <span className="text-muted-foreground">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedDate(getPreviousSundayStr())}
                  className={cn(
                    "hover:underline font-semibold",
                    selectedDate === getPreviousSundayStr() ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  Last Sunday
                </button>
              </div>
            </div>
            <DatePicker
              value={selectedDate}
              onChange={(val) => setSelectedDate(val || getTodayStr())}
              className="h-10 min-w-[150px]"
            />
          </div>
        </div>
      </div>

      {/* 📊 Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="form" className="rounded-lg text-xs font-semibold flex items-center gap-1.5">
            <UserCheck className="h-4 w-4" /> Take Attendance
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg text-xs font-semibold flex items-center gap-1.5">
            <History className="h-4 w-4" /> History
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg text-xs font-semibold flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" /> Analytics
          </TabsTrigger>
        </TabsList>

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

          {/* Session Banner if already recorded */}
          {existingSessionInfo && (
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  Attendance for <strong className="text-foreground">{selectedDate}</strong> was submitted by{" "}
                  <strong>{existingSessionInfo.submitted_by_name}</strong>. You are currently editing this record.
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                Last updated: {new Date(existingSessionInfo.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
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
                          "h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors",
                          isPresent
                            ? "bg-emerald-600 text-white"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <p className={cn("font-semibold text-sm truncate", isPresent && "text-emerald-950 dark:text-emerald-200")}>
                          {formatName(`${m.first_name} ${m.last_name}`)}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground mt-0.5">
                          {m.gender && <span>{m.gender}</span>}
                          {m.other_ministries && m.other_ministries.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-muted font-medium text-[10px]">
                              +{m.other_ministries.length} other
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Touch Toggle Checkbox */}
                    <div
                      className={cn(
                        "h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 transition-all",
                        isPresent
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
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
                placeholder="e.g. Sunday Youth Fellowship - Topic: Walking by Faith"
                className="h-10 text-xs bg-background"
              />
            </CardContent>
          </Card>

          {/* Desktop Submit Button */}
          <div className="hidden sm:flex items-center justify-end">
            <Button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isPending || isLoading}
              className="h-12 px-8 rounded-xl font-bold text-sm shadow-md gap-2"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Submit Attendance ({presentCount}/{totalEnrolled} Present)
            </Button>
          </div>

          {/* 📱 STICKY MOBILE ACTION BAR */}
          <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 p-3 bg-background/95 backdrop-blur-md border-t shadow-2xl flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Turnout Roster</p>
              <p className="text-base font-bold text-primary">
                {presentCount} / {totalEnrolled} <span className="text-xs font-semibold">({turnoutRatePct}%)</span>
              </p>
            </div>
            <Button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isPending || isLoading}
              className="h-11 px-5 rounded-xl font-bold text-xs shadow-md gap-1.5"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Submit
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
                      className="p-3.5 rounded-xl border bg-card flex items-center justify-between gap-4 text-sm shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{log.date}</span>
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
                          Submitted by {log.submitted_by_name || "Leader"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            {log.present_count} / {log.total_enrolled}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Present</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDate(log.date)
                            setActiveTab("form")
                          }}
                          className="h-8 text-xs text-primary gap-1"
                        >
                          Edit <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: ATTENDANCE ANALYTICS & CHARTS */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="analytics" className="space-y-5 mt-4">
          {analyticsData && (
            <>
              {/* Trend Area Chart */}
              <Card className="shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" /> Attendance Rate Trend (%)
                  </CardTitle>
                  <CardDescription>Turnout percentage over recent attendance sessions</CardDescription>
                </CardHeader>
                <CardContent className="h-64 pt-2">
                  {analyticsData.trend.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                      Not enough attendance records to generate trend graph.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                        <Tooltip />
                        <Area type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" name="Turnout %" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Ministry Comparison Bar Chart */}
              <Card className="shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" /> Average Turnout Rate by Ministry
                  </CardTitle>
                  <CardDescription>Comparing attendance percentage across church ministries</CardDescription>
                </CardHeader>
                <CardContent className="h-64 pt-2">
                  {analyticsData.ministryComparison.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                      No ministry attendance data recorded yet.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.ministryComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                        <Tooltip />
                        <Bar dataKey="rate" fill="#10b981" radius={[6, 6, 0, 0]} name="Avg Turnout %" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
