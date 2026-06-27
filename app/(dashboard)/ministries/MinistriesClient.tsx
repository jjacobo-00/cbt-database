"use client"

import React, { useState, useTransition } from "react"
import { Trash2, Plus, Loader2, ChurchIcon } from "lucide-react"
import { createMinistry, deleteMinistry } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Ministry = { id: string; name: string; created_at: string }

export function MinistriesClient({ ministries: initial }: { ministries: Ministry[] }) {
  const [ministries, setMinistries] = useState(initial)
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleAdd = () => {
    if (!name.trim()) { setError("Ministry name is required."); return }
    setError("")
    startTransition(async () => {
      try {
        await createMinistry(name.trim())
        setMinistries(prev => [...prev, { id: crypto.randomUUID(), name: name.trim(), created_at: new Date().toISOString() }].sort((a, b) => a.name.localeCompare(b.name)))
        setName("")
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

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Add Ministry */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-lg">Add New Ministry</h3>
        <div className="flex gap-3 items-start">
          <div className="flex-1 space-y-1">
            <Input
              placeholder="e.g. Music Ministry"
              value={name}
              onChange={e => { setName(e.target.value); setError("") }}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              className="h-11"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <Button onClick={handleAdd} disabled={isPending} className="h-11 px-6 gap-2">
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
              <li key={m.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Added {new Date(m.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(m.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
