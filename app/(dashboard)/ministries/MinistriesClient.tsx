"use client"

import React, { useState, useTransition } from "react"
import { Trash2, Plus, Loader2, ChurchIcon, Pencil, Check, X, Users, ChevronDown, ChevronRight, UserCheck, Search } from "lucide-react"
import { createMinistry, deleteMinistry, updateMinistry } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn, formatName } from "@/lib/utils/utils"

type Ministry = { id: string; name: string; for_everyone: boolean; parent_id: string | null; leader_id?: string | null; created_at: string }
type MemberOption = { id: string; first_name: string; last_name: string }

function SearchableLeaderSelect({
  value,
  onChange,
  members,
  placeholder = "Select Ministry Leader (Optional)",
  className,
}: {
  value: string
  onChange: (id: string) => void
  members: MemberOption[]
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const selectedMember = members.find((m) => m.id === value)

  const filteredMembers = React.useMemo(() => {
    if (!search.trim()) return members
    const q = search.toLowerCase()
    return members.filter((m) =>
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(q)
    )
  }, [members, search])

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "justify-between text-left font-normal bg-background text-xs sm:text-sm px-3",
            !selectedMember && "text-muted-foreground",
            className
          )}
          onClick={(e) => {
            e.stopPropagation()
            setOpen(true)
          }}
        >
          <span className="truncate flex items-center gap-1.5 min-w-0">
            <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
            {selectedMember
              ? formatName(`${selectedMember.first_name} ${selectedMember.last_name}`)
              : placeholder}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[280px] sm:w-[320px] p-2 z-[9999] shadow-2xl rounded-2xl border bg-popover text-popover-foreground"
        align="start"
        side="bottom"
        sideOffset={6}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative mb-2 px-1">
          <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leader by name..."
            className="pl-8 h-9 bg-background text-xs"
            autoFocus
          />
        </div>

        <div className="max-h-[200px] overflow-y-auto space-y-1 p-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange("")
              setOpen(false)
              setSearch("")
            }}
            className={cn(
              "w-full p-2 rounded-lg text-left text-xs font-medium transition-all flex items-center justify-between text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              !value && "bg-primary/10 text-primary font-semibold"
            )}
          >
            <span>-- No Ministry Leader --</span>
            {!value && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
          </button>

          {filteredMembers.map((m) => {
            const isSelected = value === m.id
            const initials = `${m.first_name?.[0] || ""}${m.last_name?.[0] || ""}`.toUpperCase()
            return (
              <button
                key={m.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(m.id)
                  setOpen(false)
                  setSearch("")
                }}
                className={cn(
                  "w-full p-2 rounded-xl text-left text-xs transition-all flex items-center justify-between gap-2 border select-none",
                  isSelected
                    ? "bg-primary/10 border-primary text-primary font-semibold"
                    : "bg-card hover:bg-muted/60 border-transparent text-foreground"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <span className="truncate font-medium">{formatName(`${m.first_name} ${m.last_name}`)}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function MinistriesClient({ 
  ministries: initial,
  members = []
}: { 
  ministries: Ministry[]
  members?: MemberOption[]
}) {
  const [ministries, setMinistries] = useState(initial)
  const [name, setName] = useState("")
  const [forEveryone, setForEveryone] = useState(false)
  const [leaderId, setLeaderId] = useState<string>("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  // Sub-ministry add state
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null)
  const [subName, setSubName] = useState("")
  const [subLeaderId, setSubLeaderId] = useState<string>("")
  const [subError, setSubError] = useState("")

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editForEveryone, setEditForEveryone] = useState(false)
  const [editLeaderId, setEditLeaderId] = useState<string>("")
  const [editError, setEditError] = useState("")

  // Expand state for parent ministries
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const parentMinistries = ministries.filter(m => !m.parent_id)
  const getChildren = (parentId: string) => ministries.filter(m => m.parent_id === parentId)

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleAdd = () => {
    if (!name.trim()) { setError("Ministry name is required."); return }
    setError("")
    startTransition(async () => {
      try {
        await createMinistry(name.trim(), forEveryone, null, leaderId || null)
        setMinistries(prev => [...prev, { id: crypto.randomUUID(), name: name.trim(), for_everyone: forEveryone, parent_id: null, leader_id: leaderId || null, created_at: new Date().toISOString() }].sort((a, b) => a.name.localeCompare(b.name)))
        setName("")
        setForEveryone(false)
        setLeaderId("")
      } catch (e: any) {
        setError(e.message || "Something went wrong.")
      }
    })
  }

  const handleAddSub = (parentId: string) => {
    if (!subName.trim()) { setSubError("Name is required."); return }
    setSubError("")
    startTransition(async () => {
      try {
        await createMinistry(subName.trim(), false, parentId, subLeaderId || null)
        setMinistries(prev => [...prev, { id: crypto.randomUUID(), name: subName.trim(), for_everyone: false, parent_id: parentId, leader_id: subLeaderId || null, created_at: new Date().toISOString() }])
        setSubName("")
        setSubLeaderId("")
        setAddingSubTo(null)
        setExpanded(prev => new Set(prev).add(parentId))
      } catch (e: any) {
        setSubError(e.message || "Something went wrong.")
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteMinistry(id)
        setMinistries(prev => prev.filter(m => m.id !== id && m.parent_id !== id))
      } catch {
        setError("Failed to delete ministry.")
      }
    })
  }

  const startEdit = (m: Ministry) => {
    setEditingId(m.id)
    setEditName(m.name)
    setEditForEveryone(m.for_everyone)
    setEditLeaderId(m.leader_id || "")
    setEditError("")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditForEveryone(false)
    setEditLeaderId("")
    setEditError("")
  }

  const handleUpdate = (id: string) => {
    if (!editName.trim()) { setEditError("Name cannot be empty."); return }
    setEditError("")
    startTransition(async () => {
      try {
        await updateMinistry(id, editName.trim(), editForEveryone, editLeaderId || null)
        setMinistries(prev =>
          prev.map(m => m.id === id ? { ...m, name: editName.trim(), for_everyone: editForEveryone, leader_id: editLeaderId || null } : m)
            .sort((a, b) => a.name.localeCompare(b.name))
        )
        setEditingId(null)
      } catch (e: any) {
        setEditError(e.message || "Something went wrong.")
      }
    })
  }

  const renderMinistryRow = (m: Ministry, isChild = false) => {
    const children = getChildren(m.id)
    const hasChildren = children.length > 0
    const isExpanded = expanded.has(m.id)

    const leader = members.find(mem => mem.id === m.leader_id)
    const leaderName = leader ? formatName(`${leader.first_name} ${leader.last_name}`) : null

    return (
      <React.Fragment key={m.id}>
        <li className={`flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-6 py-3.5 sm:py-4 hover:bg-muted/30 transition-colors gap-2 sm:gap-4 ${isChild ? "pl-8 sm:pl-12 bg-muted/5" : ""}`}>
          {editingId === m.id ? (
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex flex-wrap gap-2 items-center">
                <Input value={editName} onChange={e => { setEditName(e.target.value); setEditError("") }} className="h-9 flex-1 min-w-[180px]" autoFocus />
                
                {/* Ministry Leader Select */}
                <SearchableLeaderSelect
                  value={editLeaderId}
                  onChange={setEditLeaderId}
                  members={members}
                  placeholder="No Ministry Leader"
                  className="h-9 min-w-[200px]"
                />

                <Button size="icon" variant="ghost" className="h-9 w-9 text-green-500 hover:text-green-600 hover:bg-green-500/10" onClick={() => handleUpdate(m.id)} disabled={isPending}>
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={cancelEdit} disabled={isPending}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {!isChild && (
                <label className="flex items-center gap-2 cursor-pointer select-none group w-fit">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${editForEveryone ? "bg-primary border-primary" : "border-muted-foreground/40 group-hover:border-primary"}`}>
                    {editForEveryone && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                  </div>
                  <input type="checkbox" className="sr-only" checked={editForEveryone} onChange={e => setEditForEveryone(e.target.checked)} />
                  <span className="text-xs text-muted-foreground">For Everyone</span>
                </label>
              )}
              {editError && <p className="text-xs text-destructive">{editError}</p>}
            </div>
          ) : (
            <>
              <div 
                className={`flex items-center gap-2 min-w-0 flex-1 ${!isChild && hasChildren ? 'cursor-pointer select-none group' : ''}`}
                onClick={() => { if (!isChild && hasChildren) toggleExpand(m.id) }}
              >
                {!isChild && (
                  <button 
                    type="button" 
                    className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors shrink-0"
                    onClick={(e) => { e.stopPropagation(); toggleExpand(m.id) }}
                  >
                    {hasChildren ? (
                      <ChevronDown className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="w-4 h-4 inline-block" />
                    )}
                  </button>
                )}
                <span className={`font-semibold text-foreground truncate ${isChild ? "text-sm text-muted-foreground" : "text-base"}`}>
                  {m.name}
                </span>
                {m.for_everyone && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary shrink-0">
                    For Everyone
                  </span>
                )}
                {leaderName && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                    <UserCheck className="h-3 w-3" />
                    Leader: {leaderName}
                  </span>
                )}
                {hasChildren && (
                  <span className="text-xs text-muted-foreground hidden sm:inline shrink-0">
                    ({children.length} sub-ministr{children.length === 1 ? 'y' : 'ies'})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!isChild && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-primary"
                    onClick={() => {
                      setAddingSubTo(m.id)
                      setSubName("")
                      setSubLeaderId("")
                      setSubError("")
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Add Sub-ministry</span>
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => startEdit(m)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(m.id)} disabled={isPending}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}
        </li>

        {/* Sub-ministry Inline Form */}
        {addingSubTo === m.id && (
          <li className="pl-8 sm:pl-12 pr-3 sm:pr-6 py-3 bg-muted/10 border-t border-b border-dashed">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">Add Sub-ministry under "{m.name}"</span>
              <div className="flex flex-wrap gap-2 items-center">
                <Input
                  value={subName}
                  onChange={e => { setSubName(e.target.value); setSubError("") }}
                  placeholder="Sub-ministry name..."
                  className="h-9 flex-1 min-w-[180px]"
                  onKeyDown={e => { if (e.key === "Enter") handleAddSub(m.id); if (e.key === "Escape") setAddingSubTo(null) }}
                  autoFocus
                />

                {/* Sub-ministry Leader Select */}
                <SearchableLeaderSelect
                  value={subLeaderId}
                  onChange={setSubLeaderId}
                  members={members}
                  placeholder="No Ministry Leader"
                  className="h-9 min-w-[200px]"
                />

                <Button size="sm" onClick={() => handleAddSub(m.id)} disabled={isPending} className="h-9 px-4 gap-1">
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Add
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAddingSubTo(null)} className="h-9 px-3">
                  Cancel
                </Button>
              </div>
              {subError && <p className="text-xs text-destructive">{subError}</p>}
            </div>
          </li>
        )}

        {/* Render Children */}
        {!isChild && isExpanded && children.map(child => renderMinistryRow(child, true))}
      </React.Fragment>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create New Top-level Ministry */}
      <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <ChurchIcon className="h-5 w-5 text-primary" /> Create New Main Ministry
        </h3>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={name}
              onChange={e => { setName(e.target.value); setError("") }}
              placeholder="e.g. Youth Ministry, Worship Ministry..."
              className="h-11 flex-1"
              onKeyDown={e => { if (e.key === "Enter") handleAdd() }}
            />

            {/* Ministry Leader Selection */}
            <SearchableLeaderSelect
              value={leaderId}
              onChange={setLeaderId}
              members={members}
              placeholder="Select Ministry Leader (Optional)"
              className="h-11 min-w-[220px]"
            />

            <Button onClick={handleAdd} disabled={isPending} className="h-11 px-6 gap-2">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Ministry
            </Button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none group w-fit">
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${forEveryone ? "bg-primary border-primary" : "border-muted-foreground/40 group-hover:border-primary"}`}>
              {forEveryone && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
            </div>
            <input
              type="checkbox"
              className="sr-only"
              checked={forEveryone}
              onChange={e => setForEveryone(e.target.checked)}
            />
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
              For Everyone (automatically enrolls all church members)
            </span>
          </label>

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
        </div>
      </div>

      {/* List of Ministries */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b bg-muted/20 flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> All Ministries ({parentMinistries.length})
          </h3>
        </div>

        {parentMinistries.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No ministries created yet. Create one above!
          </div>
        ) : (
          <ul className="divide-y">
            {parentMinistries.map(m => renderMinistryRow(m))}
          </ul>
        )}
      </div>
    </div>
  )
}
