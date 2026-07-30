"use client"

import React, { useState, useTransition } from "react"
import { Trash2, Plus, Loader2, ChurchIcon, Pencil, Check, X, Users, ChevronDown, ChevronRight } from "lucide-react"
import { createMinistry, deleteMinistry, updateMinistry } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getErrorMessage } from "@/lib/utils/errors"

type Ministry = { id: string; name: string; for_everyone: boolean; parent_id: string | null; created_at: string }

export function MinistriesClient({ ministries: initial }: { ministries: Ministry[] }) {
  const [ministries, setMinistries] = useState(initial)
  const [name, setName] = useState("")
  const [forEveryone, setForEveryone] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  // Sub-ministry add state
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null)
  const [subName, setSubName] = useState("")
  const [subError, setSubError] = useState("")

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editForEveryone, setEditForEveryone] = useState(false)
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
        await createMinistry(name.trim(), forEveryone)
        setMinistries(prev => [...prev, { id: crypto.randomUUID(), name: name.trim(), for_everyone: forEveryone, parent_id: null, created_at: new Date().toISOString() }].sort((a, b) => a.name.localeCompare(b.name)))
        setName("")
        setForEveryone(false)
      } catch (e) {
        console.error("Error creating ministry:", e)
        setError(getErrorMessage(e, "Failed to create ministry."))
      }
    })
  }

  const handleAddSub = (parentId: string) => {
    if (!subName.trim()) { setSubError("Name is required."); return }
    setSubError("")
    startTransition(async () => {
      try {
        await createMinistry(subName.trim(), false, parentId)
        setMinistries(prev => [...prev, { id: crypto.randomUUID(), name: subName.trim(), for_everyone: false, parent_id: parentId, created_at: new Date().toISOString() }])
        setSubName("")
        setAddingSubTo(null)
        setExpanded(prev => new Set(prev).add(parentId))
      } catch (e) {
        console.error("Error creating sub-ministry:", e)
        setSubError(getErrorMessage(e, "Failed to create sub-ministry."))
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteMinistry(id)
        setMinistries(prev => prev.filter(m => m.id !== id && m.parent_id !== id))
      } catch (e) {
        console.error("Error deleting ministry:", e)
        setError(getErrorMessage(e, "Failed to delete ministry."))
      }
    })
  }

  const startEdit = (m: Ministry) => {
    setEditingId(m.id)
    setEditName(m.name)
    setEditForEveryone(m.for_everyone)
    setEditError("")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditForEveryone(false)
    setEditError("")
  }

  const handleUpdate = (id: string) => {
    if (!editName.trim()) { setEditError("Name cannot be empty."); return }
    setEditError("")
    startTransition(async () => {
      try {
        await updateMinistry(id, editName.trim(), editForEveryone)
        setMinistries(prev =>
          prev.map(m => m.id === id ? { ...m, name: editName.trim(), for_everyone: editForEveryone } : m)
            .sort((a, b) => a.name.localeCompare(b.name))
        )
        setEditingId(null)
      } catch (e) {
        console.error("Error updating ministry:", e)
        setEditError(getErrorMessage(e, "Failed to update ministry."))
      }
    })
  }

  const renderMinistryRow = (m: Ministry, isChild = false) => {
    const children = getChildren(m.id)
    const hasChildren = children.length > 0
    const isExpanded = expanded.has(m.id)

    return (
      <React.Fragment key={m.id}>
        <li className={`flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors gap-4 ${isChild ? "pl-12 bg-muted/5" : ""}`}>
          {editingId === m.id ? (
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex gap-2 items-center">
                <Input value={editName} onChange={e => { setEditName(e.target.value); setEditError("") }} onKeyDown={e => { if (e.key === "Enter") handleUpdate(m.id); if (e.key === "Escape") cancelEdit() }} className="h-9 flex-1" autoFocus />
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
                {!isChild && hasChildren && (
                  <div className="p-0.5 rounded group-hover:bg-muted/50 transition-colors shrink-0 flex items-center justify-center">
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" /> : <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />}
                  </div>
                )}
                {!isChild && !hasChildren && <div className="w-5" />}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-medium transition-colors ${!isChild && hasChildren ? 'group-hover:text-primary' : ''}`}>{m.name}</p>
                    {m.for_everyone && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                        <Users className="h-3 w-3" /> For Everyone
                      </span>
                    )}
                    {hasChildren && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                        {children.length} sub
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Added {new Date(m.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!isChild && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => { setAddingSubTo(addingSubTo === m.id ? null : m.id); setSubName(""); setSubError("") }}
                    disabled={isPending}
                    title="Add sub-ministry"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => startEdit(m)} disabled={isPending}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(m.id)} disabled={isPending}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </li>

        {/* Inline add sub-ministry */}
        {addingSubTo === m.id && (
          <li className="px-6 pl-12 py-3 bg-muted/10 border-t border-dashed">
            <div className="flex gap-2 items-start">
              <div className="flex-1 space-y-1">
                <Input
                  placeholder={`Add sub-ministry to ${m.name}...`}
                  value={subName}
                  onChange={e => { setSubName(e.target.value); setSubError("") }}
                  onKeyDown={e => { if (e.key === "Enter") handleAddSub(m.id); if (e.key === "Escape") setAddingSubTo(null) }}
                  className="h-9"
                  autoFocus
                />
                {subError && <p className="text-xs text-destructive">{subError}</p>}
              </div>
              <Button size="sm" onClick={() => handleAddSub(m.id)} disabled={isPending} className="h-9 gap-1.5">
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingSubTo(null)} className="h-9">
                <X className="h-3 w-3" />
              </Button>
            </div>
          </li>
        )}

        {/* Render children if expanded */}
        {!isChild && isExpanded && children.map(child => renderMinistryRow(child, true))}
      </React.Fragment>
    )
  }

  return (
    <div className="space-y-8">
      {/* Add Ministry */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-lg">Add New Ministry</h3>
        <div className="flex gap-3 items-start">
          <div className="flex-1 space-y-3">
            <Input
              placeholder="e.g. Music Ministry"
              value={name}
              onChange={e => { setName(e.target.value); setError("") }}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              className="h-11"
            />
            <label className="flex items-center gap-3 cursor-pointer select-none group w-fit">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${forEveryone ? "bg-primary border-primary" : "border-muted-foreground/40 group-hover:border-primary"}`}>
                {forEveryone && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
              <input type="checkbox" className="sr-only" checked={forEveryone} onChange={e => setForEveryone(e.target.checked)} />
              <div>
                <span className="font-medium text-sm">For Everyone (e.g. Evangelism)</span>
                <p className="text-xs text-muted-foreground">All current and new members will automatically be enrolled in this ministry</p>
              </div>
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <Button onClick={handleAdd} disabled={isPending} className="h-11 px-6 gap-2 mt-0.5">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </Button>
        </div>
      </div>

      {/* Ministry List */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-lg">Ministries</h3>
          <span className="text-sm text-muted-foreground">{parentMinistries.length} ministries</span>
        </div>
        {parentMinistries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <ChurchIcon className="h-10 w-10 opacity-30" />
            <p className="text-sm">No ministries yet. Add one above.</p>
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
