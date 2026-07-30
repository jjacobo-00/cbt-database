"use client"

import React, { useState, useTransition } from "react"
import { Trash2, Plus, Loader2, Pencil, Check, X, Gift, Calendar, Search } from "lucide-react"
import { createOfferingCategory, deleteOfferingCategory, updateOfferingCategory } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils/utils"
import { getErrorMessage } from "@/lib/utils/errors"

const MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

type OfferingCategory = {
  id: string
  name: string
  description: string | null
  is_monthly: boolean
  month: number | null
  created_at: string
}

type MemberOfferingRow = {
  member_id: string
  first_name: string
  last_name: string
  contact_number: string | null
  offerings: { offering_category_id: string; offering_name: string }[]
}

export function OfferingsClient({
  categories: initialCategories,
  memberPledges,
  year,
}: {
  categories: OfferingCategory[]
  memberPledges: MemberOfferingRow[]
  year: number
}) {
  const [activeTab, setActiveTab] = useState<"pledges" | "categories">("pledges")
  const [categories, setCategories] = useState(initialCategories)
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()

  // Add state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isMonthly, setIsMonthly] = useState(false)
  const [month, setMonth] = useState<number | null>(null)
  const [error, setError] = useState("")

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editIsMonthly, setEditIsMonthly] = useState(false)
  const [editMonth, setEditMonth] = useState<number | null>(null)
  const [editError, setEditError] = useState("")

  const filteredPledges = memberPledges.filter(m => {
    const name = `${m.first_name} ${m.last_name}`.toLowerCase()
    return name.includes(search.toLowerCase())
  })

  const handleAdd = () => {
    if (!name.trim()) { setError("Name is required."); return }
    setError("")
    startTransition(async () => {
      try {
        await createOfferingCategory(name, description, isMonthly, month)
        setCategories(prev => [...prev, {
          id: crypto.randomUUID(), name: name.trim(), description: description.trim() || null,
          is_monthly: isMonthly, month, created_at: new Date().toISOString()
        }].sort((a, b) => a.name.localeCompare(b.name)))
        setName(""); setDescription(""); setIsMonthly(false); setMonth(null)
      } catch (e) {
        console.error("Error creating offering category:", e)
        setError(getErrorMessage(e, "Failed to create offering category."))
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteOfferingCategory(id)
        setCategories(prev => prev.filter(c => c.id !== id))
      } catch (e) {
        console.error("Error deleting offering category:", e)
        setError(getErrorMessage(e, "Failed to delete offering category."))
      }
    })
  }

  const startEdit = (c: OfferingCategory) => {
    setEditingId(c.id); setEditName(c.name); setEditDesc(c.description || "")
    setEditIsMonthly(c.is_monthly); setEditMonth(c.month); setEditError("")
  }

  const handleUpdate = (id: string) => {
    if (!editName.trim()) { setEditError("Name is required."); return }
    startTransition(async () => {
      try {
        await updateOfferingCategory(id, editName, editDesc, editIsMonthly, editMonth)
        setCategories(prev => prev.map(c => c.id === id ? {
          ...c, name: editName.trim(), description: editDesc.trim() || null,
          is_monthly: editIsMonthly, month: editMonth
        } : c).sort((a, b) => a.name.localeCompare(b.name)))
        setEditingId(null)
      } catch (e) {
        console.error("Error updating offering category:", e)
        setEditError(getErrorMessage(e, "Failed to update offering category."))
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Tabs Header */}
      <div className="flex border-b gap-6">
        <button
          onClick={() => setActiveTab("pledges")}
          className={cn(
            "pb-3 font-semibold text-sm transition-all border-b-2",
            activeTab === "pledges"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Member Offering Commitments ({year})
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={cn(
            "pb-3 font-semibold text-sm transition-all border-b-2",
            activeTab === "categories"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Offering Categories Setup ({categories.length})
        </button>
      </div>

      {/* Tab 1: Member Offering Pledges */}
      {activeTab === "pledges" && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
          </div>

          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Member</th>
                    <th className="px-4 py-3 text-left font-medium">Offerings</th>
                    <th className="px-4 py-3 text-right font-medium">Commitment Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredPledges.map(m => (
                    <tr key={m.member_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        {m.first_name} {m.last_name}
                      </td>
                      <td className="px-4 py-3">
                        {m.offerings.length === 0 ? (
                          <span className="text-muted-foreground text-xs italic">No offering commitments</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {m.offerings.map(o => (
                              <span key={o.offering_category_id} className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                                🎁 {o.offering_name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {m.offerings.length}
                      </td>
                    </tr>
                  ))}
                  {filteredPledges.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-12 text-center text-muted-foreground">
                        No member offering commitments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Offering Categories Setup */}
      {activeTab === "categories" && (
        <div className="space-y-8 max-w-2xl">
          {/* Add Category */}
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-lg">Add Offering Category</h3>
            <div className="space-y-3">
              <Input placeholder="e.g. Church Anniversary" value={name} onChange={e => { setName(e.target.value); setError("") }} className="h-11" />
              <Input placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} className="h-11" />
              <div className="flex flex-wrap gap-4 items-center">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={isMonthly} onChange={e => { setIsMonthly(e.target.checked); if (e.target.checked) setMonth(null) }} className="w-4 h-4 accent-primary" />
                  <span className="text-sm">Monthly recurring</span>
                </label>
                {!isMonthly && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Month:</Label>
                    <select value={month || ""} onChange={e => setMonth(e.target.value ? Number(e.target.value) : null)}
                      className="h-9 rounded-md border border-input bg-background text-foreground px-2 text-sm">
                      <option value="">Any</option>
                      {MONTHS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={handleAdd} disabled={isPending} className="gap-2">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Category
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-lg">Categories List</h3>
              <span className="text-sm text-muted-foreground">{categories.length} total</span>
            </div>
            {categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <Gift className="h-10 w-10 opacity-30" />
                <p className="text-sm">No offering categories configured.</p>
              </div>
            ) : (
              <ul className="divide-y">
                {categories.map(c => (
                  <li key={c.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors gap-4">
                    {editingId === c.id ? (
                      <div className="flex flex-1 flex-col gap-2">
                        <div className="flex gap-2">
                          <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-9 flex-1" autoFocus />
                          <Button size="icon" variant="ghost" className="h-9 w-9 text-green-500" onClick={() => handleUpdate(c.id)} disabled={isPending}>
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                        </div>
                        <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description" className="h-8 text-sm" />
                        <div className="flex gap-3 items-center">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                            <input type="checkbox" checked={editIsMonthly} onChange={e => { setEditIsMonthly(e.target.checked); if (e.target.checked) setEditMonth(null) }} className="w-3.5 h-3.5 accent-primary" />
                            Monthly
                          </label>
                          {!editIsMonthly && (
                            <select value={editMonth || ""} onChange={e => setEditMonth(e.target.value ? Number(e.target.value) : null)}
                              className="h-7 rounded border border-input bg-background text-xs px-1.5">
                              <option value="">Any month</option>
                              {MONTHS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                            </select>
                          )}
                        </div>
                        {editError && <p className="text-xs text-destructive">{editError}</p>}
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{c.name}</p>
                            {c.is_monthly && (
                              <span className="text-[10px] font-semibold bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Monthly
                              </span>
                            )}
                            {!c.is_monthly && c.month && (
                              <span className="text-[10px] font-semibold bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">
                                {MONTHS[c.month]}
                              </span>
                            )}
                          </div>
                          {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => startEdit(c)} disabled={isPending}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(c.id)} disabled={isPending}>
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
      )}
    </div>
  )
}
