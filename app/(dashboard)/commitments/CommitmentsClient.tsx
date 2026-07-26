"use client"

import React, { useState, useTransition } from "react"
import { Search, Loader2, Pencil, X, Check, Plus, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { upsertCommitment } from "./actions"
import { cn } from "@/lib/utils/utils"

type CommitmentRow = {
  id: string
  member_id: string
  year: number
  first_name: string
  last_name: string
  contact_number: string | null
  has_pledged: boolean
  ministries: { commitment_id: string; ministry_id: string; ministry_name: string; parent_id: string | null }[]
  offerings: { commitment_id: string; offering_category_id: string; offering_name: string }[]
}

type Ministry = { id: string; name: string; parent_id: string | null }
type OfferingCat = { id: string; name: string; is_monthly: boolean; month: number | null }

export function CommitmentsClient({
  commitments: initial,
  year: initialYear,
  availableYears,
  allMinistries,
  allOfferings,
}: {
  commitments: CommitmentRow[]
  year: number
  availableYears: number[]
  allMinistries: Ministry[]
  allOfferings: OfferingCat[]
}) {
  const [commitmentsList, setCommitmentsList] = useState(initial)
  const [year, setYear] = useState(initialYear)
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()

  // Edit modal state
  const [editingMember, setEditingMember] = useState<CommitmentRow | null>(null)
  const [editMinistries, setEditMinistries] = useState<string[]>([])
  const [editOfferings, setEditOfferings] = useState<string[]>([])

  const filtered = commitmentsList.filter(c => {
    const name = `${c.first_name} ${c.last_name}`.toLowerCase()
    return name.includes(search.toLowerCase())
  })

  const handleYearChange = (newYear: number) => {
    setYear(newYear)
    window.location.href = `/commitments?year=${newYear}`
  }

  const openEdit = (c: CommitmentRow) => {
    setEditingMember(c)
    setEditMinistries(c.ministries.map(m => m.ministry_id))
    setEditOfferings(c.offerings.map(o => o.offering_category_id))
  }

  const toggleMinistry = (id: string) => {
    setEditMinistries(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleOffering = (id: string) => {
    setEditOfferings(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleSaveEdit = () => {
    if (!editingMember) return
    startTransition(async () => {
      try {
        await upsertCommitment(editingMember.member_id, year, editMinistries, editOfferings)
        setCommitmentsList(prev => prev.map(c => c.member_id === editingMember.member_id ? {
          ...c,
          has_pledged: editMinistries.length > 0 || editOfferings.length > 0,
          ministries: editMinistries.map(mid => {
            const min = allMinistries.find(m => m.id === mid)
            return { commitment_id: c.id, ministry_id: mid, ministry_name: min?.name || "", parent_id: min?.parent_id || null }
          }),
          offerings: editOfferings.map(oid => {
            const off = allOfferings.find(o => o.id === oid)
            return { commitment_id: c.id, offering_category_id: oid, offering_name: off?.name || "" }
          }),
        } : c))
        setEditingMember(null)
      } catch { /* error handling */ }
    })
  }

  // Ministry grouping helpers
  const parentMinistries = allMinistries.filter(m => !m.parent_id)
  const getChildren = (pid: string) => allMinistries.filter(m => m.parent_id === pid)

  // Stats
  const totalMembers = commitmentsList.length
  const pledgedMembers = commitmentsList.filter(c => c.has_pledged).length
  const uniqueMinistries = new Set(commitmentsList.flatMap(c => c.ministries.map(m => m.ministry_name)))

  const yearOptions = [...new Set([...availableYears, year, year - 1, year + 1])].sort((a, b) => b - a)

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Active Year:</span>
          <select
            value={year}
            onChange={e => handleYearChange(Number(e.target.value))}
            className="h-10 rounded-lg border border-input bg-background text-foreground px-3 font-semibold text-lg"
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Directory Members Pledged</p>
          <p className="text-3xl font-bold mt-1">{pledgedMembers} <span className="text-sm font-normal text-muted-foreground">/ {totalMembers}</span></p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Active Ministries</p>
          <p className="text-3xl font-bold mt-1">{uniqueMinistries.size}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Pledge Rate</p>
          <p className="text-3xl font-bold mt-1">{totalMembers ? Math.round((pledgedMembers / totalMembers) * 100) : 0}%</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Member</th>
                <th className="px-4 py-3 text-left font-medium">Ministries Pledged</th>
                <th className="px-4 py-3 text-left font-medium">Offerings Pledged</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(c => (
                <tr key={c.member_id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.first_name} {c.last_name}</p>
                    <p className="text-xs text-muted-foreground">{c.contact_number || "-"}</p>
                  </td>
                  <td className="px-4 py-3">
                    {c.ministries.length === 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                        <AlertCircle className="h-3 w-3" /> None
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {c.ministries.map(m => (
                          <span key={m.ministry_id} className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                            {m.ministry_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.offerings.length === 0 ? (
                      <span className="text-muted-foreground text-xs font-normal">-</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {c.offerings.map(o => (
                          <span key={o.offering_category_id} className="text-[11px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                            {o.offering_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.has_pledged ? (
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)} className="gap-1">
                        <Pencil className="h-3.5 w-3.5" /> Edit Pledges
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => openEdit(c)} className="gap-1 text-xs">
                        <Plus className="h-3.5 w-3.5" /> Set Pledges
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    No members found in directory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingMember(null)}>
          <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-semibold">Ministry & Offering Pledges</h2>
                <p className="text-sm text-muted-foreground">{editingMember.first_name} {editingMember.last_name} — {year}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditingMember(null)}><X className="h-5 w-5" /></Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Ministries */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Ministry Pledges</h3>
                <div className="space-y-2">
                  {parentMinistries.map(parent => {
                    const children = getChildren(parent.id)
                    if (children.length === 0) {
                      const checked = editMinistries.includes(parent.id)
                      return (
                        <label key={parent.id} className={cn("flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all", checked ? "border-primary bg-primary/5" : "hover:bg-muted/30")}>
                          <input type="checkbox" checked={checked} onChange={() => toggleMinistry(parent.id)} className="w-4 h-4 accent-primary" />
                          <span className="text-sm font-medium">{parent.name}</span>
                        </label>
                      )
                    }
                    return (
                      <div key={parent.id} className="rounded-lg border overflow-hidden">
                        <div className="px-3 py-2.5 bg-muted/20 font-semibold text-sm">{parent.name}</div>
                        <div className="divide-y">
                          {children.map(child => {
                            const checked = editMinistries.includes(child.id)
                            return (
                              <label key={child.id} className={cn("flex items-center gap-3 pl-6 pr-3 py-2.5 cursor-pointer transition-all", checked ? "bg-primary/5" : "hover:bg-muted/20")}>
                                <input type="checkbox" checked={checked} onChange={() => toggleMinistry(child.id)} className="w-3.5 h-3.5 accent-primary" />
                                <span className="text-sm">{child.name}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Offerings */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Offering Pledges</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allOfferings.map(off => {
                    const checked = editOfferings.includes(off.id)
                    return (
                      <label key={off.id} className={cn("flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all", checked ? "border-amber-500/50 bg-amber-500/5" : "hover:bg-muted/30")}>
                        <input type="checkbox" checked={checked} onChange={() => toggleOffering(off.id)} className="w-4 h-4 accent-amber-500" />
                        <span className="text-sm font-medium">{off.name}</span>
                      </label>
                    )
                  })}
                  {allOfferings.length === 0 && <p className="text-sm text-muted-foreground col-span-2">No offering categories configured.</p>}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-card border-t px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditingMember(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={isPending} className="gap-2">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save Pledges
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
