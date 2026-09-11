"use client"

import { useState, useMemo } from "react"
import { addOrgNode, updateOrgNode, deleteOrgNode } from "@/app/actions/org-chart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Edit2,
  Trash2,
  UserCircle2,
  Network,
  Check,
  ChevronsUpDown,
  UserPlus,
  ShieldAlert,
  Users,
  Briefcase,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import { cn, formatName, formatFullName, formatSuffix } from "@/lib/utils/utils"
import Link from "next/link"

export type OrgNode = {
  id: string
  role_title: string
  member_id: string | null
  parent_id: string | null
  sort_order: number | null
}

export type OrgMember = {
  id: string
  first_name: string
  middle_name?: string | null
  last_name: string
  suffix?: string | null
  contact_number?: string | null
  church_role?: string | null
}

export function OrgChartClient({
  initialNodes,
  members,
}: {
  initialNodes: OrgNode[]
  members: OrgMember[]
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNode, setEditingNode] = useState<OrgNode | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [roleTitle, setRoleTitle] = useState("")
  const [memberId, setMemberId] = useState<string>("unassigned")
  const [parentId, setParentId] = useState<string>("root")
  const [memberComboboxOpen, setMemberComboboxOpen] = useState(false)

  // Member lookup map for fast lookups
  const memberMap = useMemo(() => {
    const map = new Map<string, OrgMember>()
    members.forEach((m) => map.set(m.id, m))
    return map
  }, [members])

  // Selected member object
  const selectedMember = memberId !== "unassigned" ? memberMap.get(memberId) : null

  // Calculate descendant node IDs when editing to prevent circular hierarchy loops
  const invalidParentIds = useMemo(() => {
    if (!editingNode) return new Set<string>()
    const forbidden = new Set<string>([editingNode.id])

    const addDescendants = (nodeId: string) => {
      initialNodes
        .filter((n) => n.parent_id === nodeId)
        .forEach((child) => {
          forbidden.add(child.id)
          addDescendants(child.id)
        })
    }

    addDescendants(editingNode.id)
    return forbidden
  }, [editingNode, initialNodes])

  const handleOpenDialog = (node?: OrgNode, defaultParentId?: string) => {
    if (node) {
      setEditingNode(node)
      setRoleTitle(node.role_title)
      setMemberId(node.member_id || "unassigned")
      setParentId(node.parent_id || "root")
    } else {
      setEditingNode(null)
      setRoleTitle("")
      setMemberId("unassigned")
      setParentId(defaultParentId || "root")
    }
    setMemberComboboxOpen(false)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!roleTitle.trim()) {
      toast.error("Role title is required")
      return
    }

    setIsLoading(true)
    const mId = memberId === "unassigned" ? null : memberId
    const pId = parentId === "root" ? null : parentId

    if (editingNode) {
      const res = await updateOrgNode(editingNode.id, {
        role_title: roleTitle.trim(),
        member_id: mId,
        parent_id: pId,
      })
      if (res.success) {
        toast.success("Role updated")
        setIsDialogOpen(false)
      } else {
        toast.error("Failed to update: " + res.error)
      }
    } else {
      const res = await addOrgNode({
        role_title: roleTitle.trim(),
        member_id: mId,
        parent_id: pId,
      })
      if (res.success) {
        toast.success("Role added to org chart")
        setIsDialogOpen(false)
      } else {
        toast.error("Failed to add: " + res.error)
      }
    }
    setIsLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this role? Anyone reporting directly to this role will be moved to the top level."
      )
    )
      return

    setIsLoading(true)
    const res = await deleteOrgNode(id)
    if (res.success) {
      toast.success("Role deleted")
    } else {
      toast.error("Failed to delete: " + res.error)
    }
    setIsLoading(false)
  }

  // Build Tree
  const buildTree = (nodes: OrgNode[], pId: string | null = null): OrgNode[] => {
    return nodes
      .filter((n) => n.parent_id === pId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  }

  // Summary Metrics
  const totalRoles = initialNodes.length
  const filledRoles = initialNodes.filter((n) => n.member_id).length
  const vacantRoles = totalRoles - filledRoles

  const renderNode = (node: OrgNode, level: number = 0) => {
    const children = buildTree(initialNodes, node.id)
    const assignedMember = node.member_id ? memberMap.get(node.member_id) : null
    const isRoot = level === 0

    return (
      <div key={node.id} className="relative">
        <div
          className={cn(
            "flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-4 mb-3 border rounded-xl bg-card shadow-sm transition-all hover:border-primary/50 hover:shadow-md group",
            isRoot
              ? "border-primary/50 shadow-md bg-gradient-to-r from-primary/5 to-transparent ring-1 ring-primary/20"
              : "ml-2 sm:ml-8",
            !assignedMember && "border-dashed border-amber-500/30 bg-amber-500/[0.02]"
          )}
        >
          {/* Vertical connecting line from parent if not root */}
          {!isRoot && (
            <div className="absolute -left-2 sm:-left-8 top-8 w-2 sm:w-8 h-[2px] bg-border" />
          )}

          <div className="flex items-center gap-3 sm:gap-4 w-full min-w-0">
            {/* Avatar / Icon */}
            <div
              className={cn(
                "h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0 flex items-center justify-center font-bold text-sm sm:text-base transition-colors",
                isRoot
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : assignedMember
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-muted text-muted-foreground/60 border border-dashed border-muted-foreground/30"
              )}
            >
              {assignedMember ? (
                <span>
                  {assignedMember.first_name[0]}
                  {assignedMember.last_name[0]}
                </span>
              ) : (
                <UserCircle2 className="h-6 w-6 opacity-40" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                  {node.role_title}
                </h3>
                {isRoot && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">
                    Senior Leadership
                  </Badge>
                )}
                {!assignedMember && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10">
                    Vacant
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5 text-xs sm:text-sm">
                {assignedMember ? (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-medium text-foreground truncate">
                      {formatFullName(assignedMember)}
                    </span>
                    {assignedMember.church_role && assignedMember.church_role !== "Member" && (
                      <span className="text-[11px] text-muted-foreground hidden sm:inline">
                        • {assignedMember.church_role}
                      </span>
                    )}
                    <Link
                      href={`/members/${assignedMember.id}`}
                      className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center shrink-0 ml-0.5"
                      title="View Member Profile"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenDialog(node)}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <UserPlus className="h-3 w-3" /> Assign a member
                  </button>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-primary"
                onClick={() => handleOpenDialog(undefined, node.id)}
                title="Add Direct Report / Sub-Role"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Add Sub-Role</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => handleOpenDialog(node)}
                title="Edit Role"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDelete(node.id)}
                title="Delete Role"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Children Container */}
        {children.length > 0 && (
          <div className="relative">
            {/* Vertical spine line for children */}
            <div className="absolute left-4 sm:left-10 top-0 bottom-6 w-[2px] bg-border" />
            <div className="pl-3 sm:pl-10">
              {children.map((child) => renderNode(child, level + 1))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const rootNodes = buildTree(initialNodes, null)

  return (
    <div className="space-y-6">
      {/* Top Bar: Overview Metrics & Add Role Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 border rounded-xl p-4">
        <div className="grid grid-cols-3 gap-4 sm:flex sm:items-center sm:gap-6">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-[11px] text-muted-foreground uppercase font-semibold">Roles</p>
              <p className="text-base sm:text-lg font-bold">{totalRoles}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 border-l pl-4 sm:pl-6">
            <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-[11px] text-muted-foreground uppercase font-semibold">Filled</p>
              <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {filledRoles}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 border-l pl-4 sm:pl-6">
            <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-[11px] text-muted-foreground uppercase font-semibold">Vacant</p>
              <p className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">
                {vacantRoles}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => handleOpenDialog()} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Add Role
          </Button>
        </div>
      </div>

      {initialNodes.length === 0 ? (
        <div className="text-center p-12 border rounded-xl border-dashed bg-muted/30">
          <Network className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium">No roles defined</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2">
            Start building your organizational chart by adding top-level roles first (e.g., Senior Pastor, Executive Council).
          </p>
          <Button onClick={() => handleOpenDialog()} className="mt-6">
            Add First Role
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4 touch-contain">
          <div className="min-w-[320px] sm:min-w-[600px] py-2">
            {rootNodes.map((node) => renderNode(node, 0))}
          </div>
        </div>
      )}

      {/* Role Edit/Add Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingNode ? "Edit Role" : "Add New Role"}</DialogTitle>
            <DialogDescription>
              Define the title, hierarchy position, and assign a church member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Role Title */}
            <div className="space-y-2">
              <Label>Role Title / Position <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Senior Pastor, Ministry Overseer, Deacon..."
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                autoFocus
              />
            </div>

            {/* Assigned Member Combobox (Searchable) */}
            <div className="space-y-2">
              <Label>Assigned Member (Optional)</Label>
              <Popover open={memberComboboxOpen} onOpenChange={setMemberComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={memberComboboxOpen}
                    className="w-full justify-between font-normal h-10 px-3 bg-background"
                  >
                    {selectedMember ? (
                      <div className="flex items-center gap-2 truncate">
                        <div className="h-6 w-6 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                          {selectedMember.first_name[0]}
                          {selectedMember.last_name[0]}
                        </div>
                        <span className="truncate font-medium">{formatFullName(selectedMember)}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-2">
                        <UserCircle2 className="h-4 w-4 opacity-50" />
                        -- Unassigned / Vacant --
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[340px] sm:w-[380px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search member by name or suffix..." className="h-10" />
                    <CommandList className="max-h-64">
                      <CommandEmpty className="py-6 text-center text-sm px-4">
                        <span className="block font-medium mb-1">No member found.</span>
                        <span className="text-muted-foreground text-xs">Verify name spelling in CBT Member directory.</span>
                      </CommandEmpty>
                      <CommandGroup>
                        {/* Vacant / Unassigned Option */}
                        <CommandItem
                          value="unassigned none vacant"
                          onSelect={() => {
                            setMemberId("unassigned")
                            setMemberComboboxOpen(false)
                          }}
                          className="flex items-center justify-between py-2 border-b border-border/50 text-muted-foreground"
                        >
                          <div className="flex items-center gap-2">
                            <UserCircle2 className="h-4 w-4 opacity-50" />
                            <span>-- Unassigned / Vacant --</span>
                          </div>
                          {memberId === "unassigned" && <Check className="h-4 w-4 text-primary" />}
                        </CommandItem>

                        {/* Members List */}
                        {members.map((m) => {
                          const fullName = formatFullName(m)
                          const baseName = formatName(`${m.first_name} ${m.last_name}`)
                          const suffix = formatSuffix(m.suffix)
                          const searchKey = `${m.id} ${fullName} ${m.first_name} ${m.last_name} ${suffix} ${m.contact_number || ""} ${m.church_role || ""}`
                          const isSelected = memberId === m.id

                          return (
                            <CommandItem
                              key={m.id}
                              value={searchKey}
                              onSelect={() => {
                                setMemberId(m.id)
                                setMemberComboboxOpen(false)
                              }}
                              className="flex items-center justify-between py-2 cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center shrink-0">
                                  {m.first_name[0]}
                                  {m.last_name[0]}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-medium text-sm leading-tight text-foreground">{baseName}</span>
                                    {suffix && (
                                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary/15 text-primary border border-primary/30 shrink-0">
                                        {suffix}
                                      </span>
                                    )}
                                  </div>
                                  {m.church_role && m.church_role !== "Member" && (
                                    <span className="text-[11px] text-muted-foreground">
                                      {m.church_role}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Check
                                className={cn(
                                  "h-4 w-4 text-primary shrink-0 ml-2",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Reports To Select (Protected against circular loops) */}
            <div className="space-y-2">
              <Label>Reports To (Manager / Parent Position)</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select manager/parent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">-- Top Level (No Manager) --</SelectItem>
                  {initialNodes
                    .filter((n) => !invalidParentIds.has(n.id))
                    .map((n) => (
                      <SelectItem key={n.id} value={n.id}>
                        {n.role_title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {editingNode && invalidParentIds.size > 1 && (
                <p className="text-[11px] text-muted-foreground">
                  Sub-roles under "{editingNode.role_title}" are hidden to prevent hierarchy loops.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
