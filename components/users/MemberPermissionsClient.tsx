"use client"

import React, { useState, useTransition } from "react"
import {
  ShieldCheck,
  UserPlus,
  Users,
  CalendarCheck,
  Church,
  Trash2,
  Edit2,
  Check,
  ChevronDown,
  Sparkles,
  Loader2,
  Search,
  AlertCircle,
  FileCheck,
  Award,
  Layers,
  CheckCircle2,
  Lock,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  DelegatedMemberPermission,
  upsertMemberPermission,
  removeMemberPermission,
  seedDemographicMinistries,
} from "@/app/(dashboard)/users/actions"
import { getDemographicCategory } from "@/lib/constants/demographic-ministries"

type MemberOption = {
  id: string
  first_name: string
  middle_name?: string | null
  last_name: string
  suffix?: string | null
  email?: string | null
  contact_number?: string | null
  gender?: string | null
  church_role?: string | null
}

type MinistryOption = {
  id: string
  name: string
  description?: string | null
}

const CATEGORY_COLORS: Record<"men" | "ladies" | "youth", { bg: string; text: string; border: string; iconBg: string }> = {
  men: {
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-500/30",
    iconBg: "bg-blue-600 text-white",
  },
  ladies: {
    bg: "bg-rose-500/10 dark:bg-rose-500/20",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-500/30",
    iconBg: "bg-rose-600 text-white",
  },
  youth: {
    bg: "bg-purple-500/10 dark:bg-purple-500/20",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-500/30",
    iconBg: "bg-purple-600 text-white",
  },
}

const DEFAULT_COLOR = {
  bg: "bg-primary/10",
  text: "text-primary",
  border: "border-primary/20",
  iconBg: "bg-primary text-primary-foreground",
}

function getMinistryStyling(name: string) {
  const cat = getDemographicCategory(name)
  return cat ? CATEGORY_COLORS[cat] : DEFAULT_COLOR
}

export function MemberPermissionsClient({
  permissionsList: initialList,
  allMembers,
  demographicMinistries,
}: {
  permissionsList: DelegatedMemberPermission[]
  allMembers: MemberOption[]
  demographicMinistries: MinistryOption[]
}) {
  const [permissionsList, setPermissionsList] = useState(initialList)
  const [searchQuery, setSearchQuery] = useState("")
  const [ministryFilter, setMinistryFilter] = useState<string>("all")

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPermission, setEditingPermission] = useState<DelegatedMemberPermission | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState("")
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [canManageAttendance, setCanManageAttendance] = useState(true)
  const [selectedMinistryIds, setSelectedMinistryIds] = useState<string[]>([])
  const [roleNotes, setRoleNotes] = useState("")

  // Delete Alert State
  const [revokingPermission, setRevokingPermission] = useState<DelegatedMemberPermission | null>(null)

  const [isPending, startTransition] = useTransition()
  const [isSeeding, startSeedingTransition] = useTransition()

  // Open modal in Add mode with optional preselected ministry
  const handleOpenAddModal = (preselectedMinistryId?: string) => {
    setEditingPermission(null)
    setSelectedMemberId("")
    setCanManageAttendance(true)
    setSelectedMinistryIds(preselectedMinistryId ? [preselectedMinistryId] : [])
    setRoleNotes("")
    setIsModalOpen(true)
  }

  // Open modal in Edit mode
  const handleOpenEditModal = (p: DelegatedMemberPermission) => {
    setEditingPermission(p)
    setSelectedMemberId(p.member_id)
    setCanManageAttendance(p.can_manage_attendance)
    setSelectedMinistryIds(p.attendance_ministry_ids || [])
    setRoleNotes(p.notes || "")
    setIsModalOpen(true)
  }

  // Toggle single ministry checkbox
  const toggleMinistry = (minId: string) => {
    setSelectedMinistryIds((prev) =>
      prev.includes(minId) ? prev.filter((id) => id !== minId) : [...prev, minId]
    )
  }

  // Select all demographic ministries shortcut
  const selectAllMinistries = () => {
    setSelectedMinistryIds(demographicMinistries.map((m) => m.id))
  }

  // Clear ministry selection
  const clearMinistries = () => {
    setSelectedMinistryIds([])
  }

  // Handle Save Permission
  const handleSavePermission = () => {
    if (!selectedMemberId) {
      toast.error("Please select a church member.")
      return
    }

    if (canManageAttendance && selectedMinistryIds.length === 0) {
      toast.error("Please select at least one demographic ministry for attendance access.")
      return
    }

    startTransition(async () => {
      try {
        await upsertMemberPermission({
          memberId: selectedMemberId,
          canManageAttendance,
          attendanceMinistryIds: selectedMinistryIds,
          notes: roleNotes,
        })

        const member = allMembers.find((m) => m.id === selectedMemberId)
        const minNames = selectedMinistryIds
          .map((id) => demographicMinistries.find((dm) => dm.id === id)?.name || "Ministry")

        setPermissionsList((prev) => {
          const filtered = prev.filter((p) => p.member_id !== selectedMemberId)
          const newEntry: DelegatedMemberPermission = {
            id: editingPermission?.id || crypto.randomUUID(),
            member_id: selectedMemberId,
            first_name: member?.first_name || "Member",
            middle_name: member?.middle_name || "",
            last_name: member?.last_name || "",
            suffix: member?.suffix || "",
            email: member?.email || "",
            contact_number: member?.contact_number || "",
            gender: member?.gender || "",
            church_role: member?.church_role || "Member",
            can_manage_attendance: canManageAttendance,
            attendance_ministry_ids: selectedMinistryIds,
            attendance_ministry_names: minNames,
            can_manage_members: false,
            can_manage_offerings: false,
            can_view_reports: false,
            notes: roleNotes,
            created_at: editingPermission?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          return [newEntry, ...filtered]
        })

        toast.success(
          editingPermission
            ? "Member permissions updated successfully!"
            : "Member granted attendance access successfully!"
        )
        setIsModalOpen(false)
      } catch (err: any) {
        console.error(err)
        toast.error(err.message || "Failed to save member permissions.")
      }
    })
  }

  // Handle Revoke Permission
  const handleConfirmRevoke = () => {
    if (!revokingPermission) return

    startTransition(async () => {
      try {
        await removeMemberPermission(revokingPermission.member_id)
        setPermissionsList((prev) =>
          prev.filter((p) => p.member_id !== revokingPermission.member_id)
        )
        toast.success("Member permissions revoked successfully.")
        setRevokingPermission(null)
      } catch (err: any) {
        console.error(err)
        toast.error(err.message || "Failed to revoke member permissions.")
      }
    })
  }

  // Handle Seed Demographic Ministries
  const handleSeedMinistries = () => {
    startSeedingTransition(async () => {
      try {
        const res = await seedDemographicMinistries()
        toast.success(
          res.createdCount > 0
            ? `Seeded ${res.createdCount} demographic ministries successfully!`
            : "Demographic ministries are already up to date."
        )
      } catch (err: any) {
        console.error(err)
        toast.error("Failed to seed demographic ministries.")
      }
    })
  }

  // Filtered List
  const filteredList = permissionsList.filter((p) => {
    const fullName = `${p.first_name} ${p.middle_name || ""} ${p.last_name}`.toLowerCase()
    const email = (p.email || "").toLowerCase()
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase())

    if (ministryFilter === "all") return matchesSearch
    return matchesSearch && p.attendance_ministry_ids.includes(ministryFilter)
  })

  // Grouped counts per demographic ministry
  const getAssignedCountForMinistry = (minId: string) => {
    return permissionsList.filter((p) => p.attendance_ministry_ids.includes(minId)).length
  }

  const getAssignedMembersForMinistry = (minId: string) => {
    return permissionsList.filter((p) => p.attendance_ministry_ids.includes(minId))
  }

  return (
    <div className="space-y-8">
      {/* 🟢 TOP ACTION & SEED BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/40 p-4 sm:p-6 rounded-2xl border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Demographic Attendance Officers</h3>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Grant church members permission to record and manage attendance for the 4 core demographic ministries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {demographicMinistries.length < 4 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedMinistries}
              disabled={isSeeding}
              className="gap-2 text-xs h-9 border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
            >
              {isSeeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Seed 4 Demographic Ministries
            </Button>
          )}

          <Button onClick={() => handleOpenAddModal()} className="gap-2 h-9 text-xs sm:text-sm font-semibold shadow-xs">
            <UserPlus className="h-4 w-4" />
            Grant Member Access
          </Button>
        </div>
      </div>

      {/* 🟢 DEMOGRAPHIC MINISTRIES MATRIX CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {demographicMinistries.map((dm) => {
          const styling = getMinistryStyling(dm.name)
          const assignedCount = getAssignedCountForMinistry(dm.id)
          const assignedMembers = getAssignedMembersForMinistry(dm.id)
          const isTargetReached = assignedCount >= 4

          return (
            <Card
              key={dm.id}
              className={cn(
                "relative overflow-hidden transition-all hover:shadow-md border",
                styling.border,
                ministryFilter === dm.id && "ring-2 ring-primary"
              )}
            >
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Demographic Ministry
                    </span>
                    <h4 className="font-bold text-base text-foreground leading-tight">{dm.name}</h4>
                  </div>
                  <div className={cn("p-2 rounded-xl shrink-0", styling.iconBg)}>
                    <Church className="h-4 w-4" />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-1">{dm.description || "Weekly attendance tracking"}</p>

                {/* Quota Progress Pill */}
                <div className="flex items-center justify-between pt-2 border-t text-xs">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    Assigned Officers:
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-bold text-xs px-2.5 py-0.5",
                      isTargetReached
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        : assignedCount > 0
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {assignedCount} {assignedCount === 1 ? "Member" : "Members"}
                  </Badge>
                </div>

                {/* Assigned Member Avatars / Badges */}
                {assignedMembers.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {assignedMembers.slice(0, 3).map((m) => (
                      <span
                        key={m.id}
                        className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium border truncate max-w-[120px]", styling.bg, styling.text, styling.border)}
                      >
                        {formatName(`${m.first_name} ${m.last_name}`)}
                      </span>
                    ))}
                    {assignedMembers.length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
                        +{assignedMembers.length - 3} more
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-muted-foreground italic pt-1">
                    No members assigned yet
                  </div>
                )}

                {/* Quick Add Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenAddModal(dm.id)}
                  className="w-full text-xs font-semibold h-8 mt-1 gap-1 text-primary hover:bg-primary/10"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Assign to {dm.name}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* 🟢 SEARCH, FILTER & DATA TABLE */}
      <Card className="border shadow-sm">
        <CardHeader className="p-4 sm:p-6 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold">Authorized Members Directory</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Church members with delegated attendance permissions and their authorized ministry scopes.
              </CardDescription>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={ministryFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setMinistryFilter("all")}
                className="text-xs h-8"
              >
                All ({permissionsList.length})
              </Button>
              {demographicMinistries.map((dm) => (
                <Button
                  key={dm.id}
                  variant={ministryFilter === dm.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMinistryFilter(dm.id)}
                  className="text-xs h-8 gap-1.5"
                >
                  <span>{dm.name}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/20 font-bold">
                    {getAssignedCountForMinistry(dm.id)}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search authorized member by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm rounded-xl"
            />
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-0">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 border rounded-2xl bg-muted/20 space-y-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Users className="h-6 w-6" />
              </div>
              <h4 className="font-semibold text-foreground text-sm">No authorized members found</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery || ministryFilter !== "all"
                  ? "Try adjusting your search query or ministry filter."
                  : "Click 'Grant Member Access' above to assign attendance officers to demographic ministries."}
              </p>
              <Button size="sm" onClick={() => handleOpenAddModal()} className="gap-2 text-xs">
                <UserPlus className="h-3.5 w-3.5" />
                Grant Member Access
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/60 text-xs uppercase font-semibold text-muted-foreground border-b">
                    <tr>
                      <th className="px-4 py-3">Member Details</th>
                      <th className="px-4 py-3">Permissions</th>
                      <th className="px-4 py-3">Assigned Demographic Ministries</th>
                      <th className="px-4 py-3">Role Notes</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredList.map((p) => {
                      const fullName = formatName(`${p.first_name} ${p.middle_name ? p.middle_name + " " : ""}${p.last_name}${p.suffix ? " " + p.suffix : ""}`)
                      const initials = `${p.first_name.charAt(0)}${p.last_name.charAt(0)}`.toUpperCase()

                      return (
                        <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                          {/* Member Details */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                                {initials}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-foreground text-sm truncate">{fullName}</span>
                                <span className="text-xs text-muted-foreground truncate">{p.email || p.contact_number || "No email registered"}</span>
                              </div>
                            </div>
                          </td>

                          {/* Permissions */}
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1">
                              {p.can_manage_attendance && (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1 text-[11px] font-semibold">
                                  <CalendarCheck className="h-3 w-3" />
                                  Attendance Active
                                </Badge>
                              )}
                            </div>
                          </td>

                          {/* Assigned Ministries */}
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1.5">
                              {p.attendance_ministry_ids.length === 0 ? (
                                <span className="text-xs text-muted-foreground italic">None assigned</span>
                              ) : (
                                p.attendance_ministry_ids.map((minId) => {
                                  const min = demographicMinistries.find((dm) => dm.id === minId)
                                  const minName = min?.name || "Ministry"
                                  const styling = getMinistryStyling(minName)

                                  return (
                                    <Badge
                                      key={minId}
                                      variant="outline"
                                      className={cn("text-[11px] font-semibold gap-1", styling.bg, styling.text, styling.border)}
                                    >
                                      <Church className="h-3 w-3" />
                                      {minName}
                                    </Badge>
                                  )
                                })
                              )}
                            </div>
                          </td>

                          {/* Notes */}
                          <td className="px-4 py-3.5">
                            <span className="text-xs text-muted-foreground truncate max-w-[160px] block">
                              {p.notes || <span className="italic text-muted-foreground/60">None</span>}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditModal(p)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRevokingPermission(p)}
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="flex flex-col md:hidden gap-3">
                {filteredList.map((p) => {
                  const fullName = formatName(`${p.first_name} ${p.last_name}`)
                  const initials = `${p.first_name.charAt(0)}${p.last_name.charAt(0)}`.toUpperCase()

                  return (
                    <div key={p.id} className="p-4 rounded-2xl bg-card border shadow-xs space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                            {initials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-foreground text-sm truncate">{fullName}</span>
                            <span className="text-xs text-muted-foreground truncate">{p.email || p.contact_number || "No email"}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(p)} className="h-8 w-8 p-0">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setRevokingPermission(p)} className="h-8 w-8 p-0 text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Scoped Ministries Badges */}
                      <div className="flex flex-wrap gap-1 pt-1 border-t">
                        {p.attendance_ministry_ids.map((minId) => {
                          const min = demographicMinistries.find((dm) => dm.id === minId)
                          const minName = min?.name || "Ministry"
                          const styling = getMinistryStyling(minName)

                          return (
                            <Badge
                              key={minId}
                              variant="outline"
                              className={cn("text-[10px] font-semibold gap-1", styling.bg, styling.text, styling.border)}
                            >
                              <Church className="h-3 w-3" />
                              {minName}
                            </Badge>
                          )
                        })}
                      </div>

                      {p.notes && (
                        <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded-lg italic">
                          "{p.notes}"
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 🟢 GRANT / EDIT PERMISSION MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {editingPermission ? "Edit Member Permissions" : "Grant Member Attendance Access"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Authorize a church member to record and submit attendance for specific demographic ministries.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Step 1: Member Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                1. Select Church Member
              </Label>

              {editingPermission ? (
                <div className="p-3 rounded-xl border bg-muted/40 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground text-sm">
                      {formatName(`${editingPermission.first_name} ${editingPermission.last_name}`)}
                    </span>
                    <span className="text-xs text-muted-foreground">{editingPermission.email || "No email"}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">Locked</Badge>
                </div>
              ) : (
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxOpen}
                      className={cn("w-full justify-between h-10 font-normal", !selectedMemberId && "text-muted-foreground")}
                    >
                      {selectedMemberId
                        ? (() => {
                            const m = allMembers.find((mem) => mem.id === selectedMemberId)
                            return m ? formatName(`${m.first_name} ${m.last_name}`) : "Select member..."
                          })()
                        : "Search member by name..."}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[340px] sm:w-[420px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search member directory..." className="h-11" />
                      <CommandList className="max-h-64">
                        <CommandEmpty>No member found.</CommandEmpty>
                        <CommandGroup>
                          {allMembers.map((m) => (
                            <CommandItem
                              key={m.id}
                              value={`${m.first_name} ${m.last_name} ${m.email || ""}`}
                              onSelect={() => {
                                setSelectedMemberId(m.id)
                                setComboboxOpen(false)
                              }}
                              className="flex items-center justify-between py-2.5"
                            >
                              <div className="flex items-center gap-2.5">
                                <Check
                                  className={cn(
                                    "h-4 w-4 text-primary",
                                    selectedMemberId === m.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-semibold text-sm">
                                    {formatName(`${m.first_name} ${m.last_name}`)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {m.email || m.contact_number || "No email"}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[11px] text-muted-foreground px-2 py-0.5 rounded bg-muted">
                                {m.church_role || "Member"}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Step 2: Permission Modules */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                2. Module Permissions
              </Label>
              <div className="grid gap-2">
                {/* Active Attendance Toggle */}
                <div
                  onClick={() => setCanManageAttendance(!canManageAttendance)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                    canManageAttendance ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20" : "bg-card hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", canManageAttendance ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      <CalendarCheck className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">Ministry Attendance Recording</span>
                      <span className="text-xs text-muted-foreground">Take turnout and submit attendance for scoped ministries</span>
                    </div>
                  </div>
                  <div className={cn("h-5 w-5 rounded-md border flex items-center justify-center", canManageAttendance ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40")}>
                    {canManageAttendance && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>

                {/* Future Extensible Capabilities (Grayed out preview) */}
                <div className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/20 opacity-60">
                  <div className="flex items-center gap-2.5">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-muted-foreground">Member Directory & Offerings</span>
                      <span className="text-[10px] text-muted-foreground">Extensible modules (coming soon)</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">Future</Badge>
                </div>
              </div>
            </div>

            {/* Step 3: Scoped Demographic Ministries */}
            {canManageAttendance && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    3. Scoped Demographic Ministries
                  </Label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={selectAllMinistries}
                      className="text-primary hover:underline font-semibold"
                    >
                      Select All
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button
                      type="button"
                      onClick={clearMinistries}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {demographicMinistries.map((dm) => {
                    const isSelected = selectedMinistryIds.includes(dm.id)
                    const styling = getMinistryStyling(dm.name)

                    return (
                      <div
                        key={dm.id}
                        onClick={() => toggleMinistry(dm.id)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                          isSelected
                            ? cn("ring-1", styling.bg, styling.border)
                            : "bg-card hover:bg-muted/40 border-border"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Church className={cn("h-4 w-4 shrink-0", isSelected ? styling.text : "text-muted-foreground")} />
                          <span className={cn("text-xs font-semibold truncate", isSelected ? styling.text : "text-foreground")}>
                            {dm.name}
                          </span>
                        </div>
                        <div className={cn("h-4 w-4 rounded border flex items-center justify-center shrink-0", isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40")}>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Role Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                4. Role Note / Title (Optional)
              </Label>
              <Input
                id="notes"
                placeholder="e.g. Sunday Attendance Checker, Youth Coordinator"
                value={roleNotes}
                onChange={(e) => setRoleNotes(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isPending} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleSavePermission} disabled={isPending} className="text-xs font-semibold gap-1.5">
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              {editingPermission ? "Update Permissions" : "Grant Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🟢 REVOKE CONFIRMATION ALERT DIALOG */}
      <AlertDialog open={!!revokingPermission} onOpenChange={(open) => !open && setRevokingPermission(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Revoke Member Access
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke delegated attendance access for{" "}
              <strong className="text-foreground">
                {revokingPermission && formatName(`${revokingPermission.first_name} ${revokingPermission.last_name}`)}
              </strong>
              ? They will no longer be able to view or submit attendance for their assigned ministries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConfirmRevoke()
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Revoking...
                </>
              ) : (
                "Revoke Access"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
