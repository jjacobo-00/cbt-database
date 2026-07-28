"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Link2, Loader2, Check, Copy, Plus, Trash2, MapPin, Shield, Clock, Users, Sparkles, AlertCircle } from "lucide-react"
import { generateInviteLink, getActiveInvitationLinks, checkMainPastorExists, revokeInviteLink } from "@/app/(dashboard)/members/actions"
import { getMissions } from "@/app/(dashboard)/missions/actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface InvitationLink {
  token: string
  member_id: string | null
  title: string | null
  max_uses: number | null
  use_count: number
  preset_role: string | null
  preset_mission_id: string | null
  mission_name: string | null
  is_disabled: boolean
  expires_at: string
  created_at: string | null
}

interface Mission {
  id: string
  name: string
}

export function GenerateInviteLinkButton({ 
  memberId, 
  variant = "outline", 
  className,
  asDropdownItem = false
}: { 
  memberId?: string
  variant?: "default" | "outline" | "ghost" | "secondary"
  className?: string 
  asDropdownItem?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [links, setLinks] = useState<InvitationLink[]>([])
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  
  // Presets & Options State (for New Member Links)
  const [missions, setMissions] = useState<Mission[]>([])
  const [existingMainPastor, setExistingMainPastor] = useState<{ first_name: string, last_name: string } | null>(null)
  
  const [title, setTitle] = useState("")
  const [presetRole, setPresetRole] = useState<string>("Member")
  const [presetMissionId, setPresetMissionId] = useState<string>("none")
  const [maxUses, setMaxUses] = useState<string>("50") // 50 default for batch
  const [expirationMinutes, setExpirationMinutes] = useState<string>("30") // 30 mins default

  const fetchInitialData = async () => {
    setIsLoading(true)
    try {
      const activeLinks = await getActiveInvitationLinks(memberId)
      setLinks(activeLinks as any)

      if (!memberId) {
        const [missionsList, pastor] = await Promise.all([
          getMissions(),
          checkMainPastorExists()
        ])
        setMissions(missionsList)
        setExistingMainPastor(pastor)
      }
    } catch (e) {
      console.error(e)
      toast.error("Failed to load invitation link settings")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchInitialData()
    }
  }, [isOpen])

  // Automatically lock max uses to 1 if presetRole is Main Pastor
  useEffect(() => {
    if (presetRole === "Main Pastor") {
      setMaxUses("1")
    }
  }, [presetRole])

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)
      
      const token = await generateInviteLink({
        memberId,
        title: title.trim() || undefined,
        presetRole: !memberId && presetRole !== "Member" ? presetRole : undefined,
        presetMissionId: !memberId && presetMissionId !== "none" ? presetMissionId : undefined,
        maxUses: memberId ? 1 : (maxUses === "unlimited" ? 0 : parseInt(maxUses, 10)),
        expirationMinutes: parseInt(expirationMinutes, 10)
      })

      const url = `${window.location.origin}/invite/${token}`
      await navigator.clipboard.writeText(url)
      
      toast.success("New shareable link created & copied to clipboard!")
      
      // Reset form options
      setTitle("")
      
      // Refresh list
      const activeLinks = await getActiveInvitationLinks(memberId)
      setLinks(activeLinks as any)
      
      setCopiedToken(token)
      setTimeout(() => setCopiedToken(null), 3000)
    } catch (e: any) {
      toast.error(e.message || "Failed to generate link")
      console.error(e)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async (token: string) => {
    try {
      const url = `${window.location.origin}/invite/${token}`
      await navigator.clipboard.writeText(url)
      setCopiedToken(token)
      toast.success("Link copied to clipboard!")
      setTimeout(() => setCopiedToken(null), 2000)
    } catch (e) {
      toast.error("Failed to copy link")
    }
  }

  const handleRevoke = async (token: string) => {
    try {
      await revokeInviteLink(token)
      setLinks(links.filter(l => l.token !== token))
      toast.success("Link disabled")
    } catch (e) {
      toast.error("Failed to disable link")
    }
  }

  const getTimeRemaining = (expiresAtStr: string) => {
    const expiresAt = new Date(expiresAtStr)
    const diffMs = expiresAt.getTime() - Date.now()
    if (diffMs <= 0) return "Expired"
    const diffMins = Math.ceil(diffMs / 60000)
    if (diffMins >= 60) {
      const hours = Math.floor(diffMins / 60)
      return `${hours}h ${diffMins % 60}m`
    }
    return `${diffMins}m`
  }

  return (
    <>
      {asDropdownItem ? (
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault()
            setIsOpen(true)
          }}
          className={className}
        >
          <Link2 className="h-4 w-4 mr-2" />
          {memberId ? "Share update form" : "Share member form"}
        </DropdownMenuItem>
      ) : (
        <Button 
          variant={variant}
          onClick={() => setIsOpen(true)} 
          className={className}
        >
          <Link2 className="h-4 w-4 mr-2" />
          {memberId ? "Share update form" : "Share member form"}
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg w-full p-0 overflow-hidden bg-card border shadow-2xl">
          <div className="p-6 pb-4 border-b bg-muted/30">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                {memberId ? "Share Profile Update Link" : "Generate Shareable Member Link"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                {memberId 
                  ? "Single-use update link for this member's profile."
                  : "Create multi-use or batch links with pre-assigned roles and mission churches."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Presets & Configuration Options (For New Member Batch Links) */}
            {!memberId && (
              <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Link Configuration & Presets
                </h4>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs text-muted-foreground">Link Title / Label (Optional)</Label>
                    <Input 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Subic Mission Pastors 2026" 
                      className="h-9 text-xs bg-background"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Pre-assigned Role</Label>
                    <Select value={presetRole} onValueChange={setPresetRole}>
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Member">Regular Member</SelectItem>
                        <SelectItem value="Mission Pastor">Mission Pastor</SelectItem>
                        <SelectItem value="Ministry Leader">Ministry Leader</SelectItem>
                        <SelectItem value="Main Pastor" disabled={!!existingMainPastor}>
                          Main Pastor {existingMainPastor ? `(Assigned to ${existingMainPastor.first_name})` : ""}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Pre-assigned Mission</Label>
                    <Select value={presetMissionId} onValueChange={setPresetMissionId}>
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">CBT Olongapo (Default)</SelectItem>
                        {missions.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Expiration Time</Label>
                    <Select value={expirationMinutes} onValueChange={setExpirationMinutes}>
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 Minutes (Default)</SelectItem>
                        <SelectItem value="60">1 Hour</SelectItem>
                        <SelectItem value="1440">24 Hours</SelectItem>
                        <SelectItem value="10080">7 Days</SelectItem>
                        <SelectItem value="43200">30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Max Registrations</Label>
                    <Select 
                      value={maxUses} 
                      onValueChange={setMaxUses}
                      disabled={presetRole === "Main Pastor"}
                    >
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50 Registrations (Batch Default)</SelectItem>
                        <SelectItem value="1">1 Registration (Single Use)</SelectItem>
                        <SelectItem value="100">100 Registrations</SelectItem>
                        <SelectItem value="unlimited">Unlimited Registrations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {presetRole === "Main Pastor" && (
                  <p className="text-[11px] text-amber-500 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" /> Main Pastor links are strictly limited to 1 registration.
                  </p>
                )}
              </div>
            )}

            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || isLoading}
              className="w-full gap-2 h-11 font-semibold shadow-sm"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {memberId ? "Generate Update Link" : "Create & Copy Shareable Link"}
            </Button>

            {/* Active Links List */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Active Shareable Links
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {links.length} Active
                </span>
              </div>
              
              <div className="border rounded-xl overflow-hidden bg-muted/10">
                <div className="divide-y max-h-[220px] overflow-y-auto">
                  {isLoading ? (
                    <div className="p-8 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      Loading links...
                    </div>
                  ) : links.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      No active shareable links found. Click above to create one.
                    </div>
                  ) : (
                    links.map((link) => {
                      const isCopied = copiedToken === link.token
                      const timeRemaining = getTimeRemaining(link.expires_at)
                      const isExpired = timeRemaining === "Expired"
                      
                      const displayToken = link.token.length > 12 
                        ? `${link.token.substring(0, 6)}...${link.token.substring(link.token.length - 6)}`
                        : link.token
                      
                      return (
                        <div 
                          key={link.token} 
                          className="p-3.5 flex flex-col gap-2 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-foreground truncate">
                              {link.title || (link.member_id ? "Profile Update Link" : "Member Registration Link")}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-semibold border",
                                isExpired 
                                  ? "bg-destructive/10 text-destructive border-destructive/20"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              )}>
                                <Clock className="h-2.5 w-2.5 inline mr-1" />
                                {timeRemaining}
                              </span>

                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                                title="Copy Link"
                                onClick={() => handleCopy(link.token)}
                              >
                                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                              </Button>

                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 rounded-md text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                                title="Revoke Link"
                                onClick={() => handleRevoke(link.token)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            {/* Usage badge */}
                            <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-mono font-medium border">
                              <Users className="h-3 w-3 inline mr-1 text-muted-foreground" />
                              {link.max_uses ? `${link.use_count} / ${link.max_uses} uses` : `${link.use_count} uses (Unlimited)`}
                            </span>

                            {/* Preset Role */}
                            {link.preset_role && (
                              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-medium border border-primary/20">
                                Role: {link.preset_role}
                              </span>
                            )}

                            {/* Preset Mission */}
                            {link.mission_name && (
                              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-medium border border-emerald-500/20">
                                Mission: {link.mission_name}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
