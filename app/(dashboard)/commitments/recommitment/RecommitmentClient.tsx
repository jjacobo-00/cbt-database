"use client"

import React, { useState, useTransition } from "react"
import { Search, Loader2, Check, X, ArrowRight, History, CheckCircle2, Clock, HelpCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { upsertCommitment } from "../actions"
import { cn, formatName, formatFullName, formatSuffix } from "@/lib/utils/utils"
import { useRouter } from "next/navigation"

type TrackerMember = {
  member_id: string
  first_name: string
  last_name: string
  suffix?: string | null
  contact_number: string | null
  status: "recommitted" | "pending" | "unassigned"
  targetYear: number
  referenceYear: number | null
  targetMinistries: { ministry_name: string }[]
  targetOfferings: { offering_name: string }[]
  referenceMinistries: { ministry_name: string }[]
  referenceOfferings: { offering_name: string }[]
}

type Ministry = { id: string; name: string; parent_id: string | null }
type OfferingCat = { id: string; name: string; is_monthly: boolean; month: number | null }

export function RecommitmentClient({
  data: initialData,
  targetYear,
  availableYears,
  allMinistries,
  allOfferings,
}: {
  data: TrackerMember[]
  targetYear: number
  availableYears: number[]
  allMinistries: Ministry[]
  allOfferings: OfferingCat[]
}) {
  const router = useRouter()
  const [list, setList] = useState(initialData)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "recommitted" | "pending" | "unassigned">("all")
  const [isPending, startTransition] = useTransition()

  // Modal state
  const [selectedMember, setSelectedMember] = useState<TrackerMember | null>(null)
  const [editMinistries, setEditMinistries] = useState<string[]>([])
  const [editOfferings, setEditOfferings] = useState<string[]>([])

  const handleYearChange = (newYear: number) => {
    startTransition(() => {
      router.push(`/commitments/recommitment?year=${newYear}`)
    })
  }

  const openRecommitModal = (m: TrackerMember) => {
    setSelectedMember(m)
    if (m.status === "recommitted") {
      // Pre-fill with target year selections
      const minIds = allMinistries.filter(am => m.targetMinistries.some(tm => tm.ministry_name === am.name)).map(am => am.id)
      const offIds = allOfferings.filter(ao => m.targetOfferings.some(to => to.offering_name === ao.name)).map(ao => ao.id)
      setEditMinistries(minIds)
      setEditOfferings(offIds)
    } else {
      // Pre-fill with prior reference selections so they can adjust / re-select
      const minIds = allMinistries.filter(am => m.referenceMinistries.some(rm => rm.ministry_name === am.name)).map(am => am.id)
      const offIds = allOfferings.filter(ao => m.referenceOfferings.some(ro => ro.offering_name === ao.name)).map(ao => ao.id)
      setEditMinistries(minIds)
      setEditOfferings(offIds)
    }
  }

  const toggleMinistry = (id: string) => {
    setEditMinistries(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleOffering = (id: string) => {
    setEditOfferings(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleSaveRecommitment = () => {
    if (!selectedMember) return
    startTransition(async () => {
      try {
        await upsertCommitment(selectedMember.member_id, targetYear, editMinistries, editOfferings)
        setList(prev => prev.map(m => {
          if (m.member_id !== selectedMember.member_id) return m

          const newTargetMins = editMinistries.map(mid => ({ ministry_name: allMinistries.find(am => am.id === mid)?.name || "" }))
          const newTargetOffs = editOfferings.map(oid => ({ offering_name: allOfferings.find(ao => ao.id === oid)?.name || "" }))
          const hasPledges = editMinistries.length > 0 || editOfferings.length > 0

          return {
            ...m,
            status: hasPledges ? "recommitted" : "unassigned",
            targetMinistries: newTargetMins,
            targetOfferings: newTargetOffs,
          }
        }))
        setSelectedMember(null)
      } catch { /* error */ }
    })
  }

  const filtered = list.filter(m => {
    const fullName = `${m.first_name || ""} ${m.last_name || ""} ${m.suffix || ""}`.toLowerCase()
    const reversed = `${m.last_name || ""}, ${m.first_name || ""} ${m.suffix || ""}`.toLowerCase()
    const q = search.toLowerCase().trim()
    const matchesSearch = fullName.includes(q) || reversed.includes(q)
    if (filterStatus === "all") return matchesSearch
    return matchesSearch && m.status === filterStatus
  })

  // Stats
  const totalCount = list.length
  const recommittedCount = list.filter(m => m.status === "recommitted").length
  const pendingCount = list.filter(m => m.status === "pending").length
  const unassignedCount = list.filter(m => m.status === "unassigned").length

  const parentMinistries = allMinistries.filter(m => !m.parent_id)
  const getChildren = (pid: string) => allMinistries.filter(m => m.parent_id === pid)

  const yearOptions = [...new Set([...availableYears, targetYear, targetYear - 1])].sort((a, b) => b - a)

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Target Recommitment Year:</span>
          <select
            value={targetYear}
            onChange={e => handleYearChange(Number(e.target.value))}
            className="h-10 rounded-lg border border-input bg-background text-foreground px-3 font-semibold text-lg"
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <button
          onClick={() => setFilterStatus(filterStatus === "recommitted" ? "all" : "recommitted")}
          className={cn("rounded-xl border bg-card p-5 text-left transition-all hover:border-emerald-500/50", filterStatus === "recommitted" && "border-emerald-500 bg-emerald-500/5")}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Recommitted for {targetYear}</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold mt-2 text-emerald-500">{recommittedCount} <span className="text-sm font-normal text-muted-foreground">/ {totalCount}</span></p>
        </button>

        <button
          onClick={() => setFilterStatus(filterStatus === "pending" ? "all" : "pending")}
          className={cn("rounded-xl border bg-card p-5 text-left transition-all hover:border-amber-500/50", filterStatus === "pending" && "border-amber-500 bg-amber-500/5")}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Needs Recommitment</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold mt-2 text-amber-500">{pendingCount}</p>
        </button>

        <button
          onClick={() => setFilterStatus(filterStatus === "unassigned" ? "all" : "unassigned")}
          className={cn("rounded-xl border bg-card p-5 text-left transition-all hover:border-muted-foreground/50", filterStatus === "unassigned" && "border-muted-foreground bg-muted/20")}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Unassigned</span>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold mt-2 text-muted-foreground">{unassignedCount}</p>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          <Button size="sm" variant={filterStatus === "all" ? "default" : "outline"} onClick={() => setFilterStatus("all")}>
            All ({totalCount})
          </Button>
          <Button size="sm" variant={filterStatus === "recommitted" ? "default" : "outline"} onClick={() => setFilterStatus("recommitted")} className={filterStatus === "recommitted" ? "bg-emerald-600" : ""}>
            Recommitted ({recommittedCount})
          </Button>
          <Button size="sm" variant={filterStatus === "pending" ? "default" : "outline"} onClick={() => setFilterStatus("pending")} className={filterStatus === "pending" ? "bg-amber-600" : ""}>
            Pending ({pendingCount})
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Member</th>
                <th className="px-4 py-3 text-left font-medium">Prior Commitments (Reference)</th>
                <th className="px-4 py-3 text-left font-medium">{targetYear} Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(m => {
                const baseName = formatName(`${m.first_name} ${m.last_name}`)
                const suffix = formatSuffix(m.suffix)
                return (
                <tr key={m.member_id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium">{baseName}</span>
                      {suffix && (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary/15 text-primary border border-primary/30 shrink-0">
                          {suffix}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{m.contact_number || "-"}</p>
                  </td>

                  {/* Prior Pledges Reference */}
                  <td className="px-4 py-3">
                    {m.referenceYear ? (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <History className="h-3 w-3" /> {m.referenceYear} Commitments
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {m.referenceMinistries.map(rm => (
                            <span key={rm.ministry_name} className="text-[11px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full">
                              {rm.ministry_name}
                            </span>
                          ))}
                          {m.referenceOfferings.map(ro => (
                            <span key={ro.offering_name} className="text-[11px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">
                              {ro.offering_name}
                            </span>
                          ))}
                          {m.referenceMinistries.length === 0 && m.referenceOfferings.length === 0 && (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No prior records</span>
                    )}
                  </td>

                  {/* Target Year Status */}
                  <td className="px-4 py-3">
                    {m.status === "recommitted" && (
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Recommitted ({m.targetMinistries.length + m.targetOfferings.length} selected)
                        </span>
                      </div>
                    )}
                    {m.status === "pending" && (
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-full">
                          <Clock className="h-3.5 w-3.5" /> Needs Recommitment
                        </span>
                      </div>
                    )}
                    {m.status === "unassigned" && (
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                          Not Committed
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 text-right">
                    {m.status === "recommitted" ? (
                      <Button variant="ghost" size="sm" onClick={() => openRecommitModal(m)} className="gap-1.5 text-xs">
                        <RefreshCw className="h-3.5 w-3.5" /> Adjust {targetYear}
                      </Button>
                    ) : (
                      <Button variant="default" size="sm" onClick={() => openRecommitModal(m)} className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700">
                        <ArrowRight className="h-3.5 w-3.5" /> Recommit for {targetYear}
                      </Button>
                    )}
                  </td>
                </tr>
              )})}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    No members match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Recommitment Reselection Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedMember(null)}>
          <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span>Recommitment for {targetYear}</span>
                </h2>
                <p className="text-sm text-muted-foreground">{formatFullName(selectedMember)}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedMember(null)}><X className="h-5 w-5" /></Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Prior Year Reference Badge Banner */}
              {selectedMember.referenceYear && (
                <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <History className="h-4 w-4 text-primary" />
                    <span>Prior Commitments ({selectedMember.referenceYear}) — For Reference</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedMember.referenceMinistries.map(rm => (
                      <span key={rm.ministry_name} className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">
                        ⛪ {rm.ministry_name}
                      </span>
                    ))}
                    {selectedMember.referenceOfferings.map(ro => (
                      <span key={ro.offering_name} className="text-xs bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full font-medium">
                        🎁 {ro.offering_name}
                      </span>
                    ))}
                    {selectedMember.referenceMinistries.length === 0 && selectedMember.referenceOfferings.length === 0 && (
                      <span className="text-xs text-muted-foreground">No recorded commitments in prior year</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground italic pt-1">
                    Review and adjust checkboxes below for {targetYear}. Check additions or uncheck dropped roles.
                  </p>
                </div>
              )}

              {/* Ministries Selection */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Select Ministries ({targetYear})</h3>
                <div className="space-y-2">
                  {parentMinistries.map(parent => {
                    const children = getChildren(parent.id)
                    if (children.length === 0) {
                      const checked = editMinistries.includes(parent.id)
                      return (
                        <label key={parent.id} className={cn("flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all", checked ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted/30")}>
                          <input type="checkbox" checked={checked} onChange={() => toggleMinistry(parent.id)} className="w-4 h-4 accent-primary" />
                          <span className="text-sm">{parent.name}</span>
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
                              <label key={child.id} className={cn("flex items-center gap-3 pl-6 pr-3 py-2.5 cursor-pointer transition-all", checked ? "bg-primary/5 font-medium" : "hover:bg-muted/20")}>
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

              {/* Offerings Selection */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Select Offerings ({targetYear})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allOfferings.map(off => {
                    const checked = editOfferings.includes(off.id)
                    return (
                      <label key={off.id} className={cn("flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all", checked ? "border-amber-500/50 bg-amber-500/5 font-medium" : "hover:bg-muted/30")}>
                        <input type="checkbox" checked={checked} onChange={() => toggleOffering(off.id)} className="w-4 h-4 accent-amber-500" />
                        <span className="text-sm">{off.name}</span>
                      </label>
                    )
                  })}
                  {allOfferings.length === 0 && <p className="text-sm text-muted-foreground col-span-2">No offering categories configured.</p>}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-card border-t px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedMember(null)}>Cancel</Button>
              <Button onClick={handleSaveRecommitment} disabled={isPending} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save {targetYear} Recommitment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
