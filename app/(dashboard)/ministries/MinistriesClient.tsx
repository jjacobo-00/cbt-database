"use client"

import React, { useState, useTransition } from "react"
import { Trash2, Plus, Loader2, ChurchIcon, Pencil, Check, X, Users } from "lucide-react"
import { createMinistry, deleteMinistry, updateMinistry } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Ministry = { id: string; name: string; for_everyone: boolean; created_at: string }

export function MinistriesClient({ ministries: initial }: { ministries: Ministry[] }) {
  const [ministries, setMinistries] = useState(initial)
  const [name, setName] = useState("")
  const [forEveryone, setForEveryone] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editForEveryone, setEditForEveryone] = useState(false)
  const [editError, setEditError] = useState("")

  const handleAdd = () => {
    if (!name.trim()) { setError("Ministry name is required."); return }
    setError("")
    startTransition(async () => {
      try {
        await createMinistry(name.trim(), forEveryone)
        setMinistries(prev => [...prev, { id: crypto.randomUUID(), name: name.trim(), for_everyone: forEveryone, created_at: new Date().toISOString() }].sort((a, b) => a.name.localeCompare(b.name)))
        setName("")
        setForEveryone(false)
      } catch (e: any) {
        setError(e.message || "Something went wrong.")
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteMinistry(id)
        setMinistries(prev => prev.filter(m => m.id !== id))
      } catch {
        setError("Failed to delete ministry.")
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
      } catch (e: any) {
        setEditError(e.message || "Something went wrong.")
      }
    })
  }

  return (
    <div className="space-y-8 max-w-2xl">
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
            {/* For Everyone checkbox */}
            <label className="flex items-center gap-3 cursor-pointer select-none group w-fit">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${forEveryone ? "bg-primary border-primary" : "border-muted-foreground/40 group-hover:border-primary"}`}>
                {forEveryone && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
              <input type="checkbox" className="sr-only" checked={forEveryone} onChange={e => setForEveryone(e.target.checked)} />
              <div>
                <span className="font-medium text-sm">For Everyone</span>
                <p className="text-xs text-muted-foreground">New members are automatically enrolled in this ministry</p>
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
          <span className="text-sm text-muted-foreground">{ministries.length} total</span>
        </div>
        {ministries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <ChurchIcon className="h-10 w-10 opacity-30" />
            <p className="text-sm">No ministries yet. Add one above.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {ministries.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors gap-4">
                {editingId === m.id ? (
                  /* Inline Edit Mode */
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex gap-2 items-center">
                      <Input
                        value={editName}
                        onChange={e => { setEditName(e.target.value); setEditError("") }}
                        onKeyDown={e => { if (e.key === "Enter") handleUpdate(m.id); if (e.key === "Escape") cancelEdit() }}
                        className="h-9 flex-1"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-9 w-9 text-green-500 hover:text-green-600 hover:bg-green-500/10" onClick={() => handleUpdate(m.id)} disabled={isPending}>
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={cancelEdit} disabled={isPending}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none group w-fit">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${editForEveryone ? "bg-primary border-primary" : "border-muted-foreground/40 group-hover:border-primary"}`}>
                        {editForEveryone && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                      </div>
                      <input type="checkbox" className="sr-only" checked={editForEveryone} onChange={e => setEditForEveryone(e.target.checked)} />
                      <span className="text-xs text-muted-foreground">For Everyone</span>
                    </label>
                    {editError && <p className="text-xs text-destructive">{editError}</p>}
                  </div>
                ) : (
                  /* Display Mode */
                  <>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{m.name}</p>
                        {m.for_everyone && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                            <Users className="h-3 w-3" /> For Everyone
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Added {new Date(m.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
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
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
