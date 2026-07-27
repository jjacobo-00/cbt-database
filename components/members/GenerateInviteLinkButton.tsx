"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Link2, Loader2, Check, Copy, Plus } from "lucide-react"
import { generateInviteLink, getActiveInvitationLinks } from "@/app/(dashboard)/members/actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface InvitationLink {
  token: string
  expires_at: string
  created_at: string | null
}

export function GenerateInviteLinkButton({ 
  memberId, 
  variant = "outline", 
  className 
}: { 
  memberId?: string
  variant?: "default" | "outline" | "ghost" | "secondary"
  className?: string 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [links, setLinks] = useState<InvitationLink[]>([])
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const fetchLinks = async () => {
    setIsLoading(true)
    try {
      const activeLinks = await getActiveInvitationLinks(memberId)
      setLinks(activeLinks)
    } catch (e) {
      console.error(e)
      toast.error("Failed to load active links")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchLinks()
    }
  }, [isOpen])

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)
      const token = await generateInviteLink(memberId)
      const url = `${window.location.origin}/invite/${token}`
      await navigator.clipboard.writeText(url)
      
      toast.success("New link generated and copied to clipboard!")
      
      // Refresh list
      const activeLinks = await getActiveInvitationLinks(memberId)
      setLinks(activeLinks)
      
      // Briefly show copied state for this new link
      setCopiedToken(token)
      setTimeout(() => setCopiedToken(null), 3000)
    } catch (e) {
      toast.error("Failed to generate link")
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

  const getTimeRemaining = (expiresAtStr: string) => {
    const expiresAt = new Date(expiresAtStr)
    const diffMs = expiresAt.getTime() - Date.now()
    if (diffMs <= 0) return "Expired"
    const diffMins = Math.ceil(diffMs / 60000)
    return `${diffMins}m remaining`
  }

  return (
    <>
      <Button 
        variant={variant}
        onClick={() => setIsOpen(true)} 
        className={className}
      >
        <Link2 className="h-4 w-4 mr-2" />
        {memberId ? "Share update form" : "Share member form"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md w-full p-0 overflow-hidden bg-card border-slate-800 shadow-2xl">
          <div className="p-6 pb-4 w-full min-w-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                {memberId ? "Share Profile Update Link" : "Share Registration Link"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Any active link allows self-service form submission for up to 30 minutes.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 pb-6 space-y-5 w-full min-w-0">
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full gap-2 h-11 font-semibold shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 transition-all duration-200"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Generate New Form Link
            </Button>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Active Links
                </span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </span>
              </div>
              
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-muted/20">
                <div className="divide-y divide-slate-800/60 max-h-[220px] overflow-y-auto">
                  {isLoading ? (
                    <div className="p-8 text-center text-sm text-muted-foreground flex justify-center items-center gap-2">
                      <Loader2 className="h-4.5 w-4.5 animate-spin text-primary" />
                      Loading links...
                    </div>
                  ) : links.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      No active links. Click above to generate one.
                    </div>
                  ) : (
                    links.map((link) => {
                      const isCopied = copiedToken === link.token
                      const timeRemaining = getTimeRemaining(link.expires_at)
                      const isExpired = timeRemaining === "Expired"
                      
                      // Shorten display token: first 8 and last 8 characters
                      const displayToken = link.token.length > 16 
                        ? `${link.token.substring(0, 8)}...${link.token.substring(link.token.length - 8)}`
                        : link.token
                      
                      return (
                        <div 
                          key={link.token} 
                          className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors min-w-0"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="text-xs font-mono truncate text-foreground/90 font-medium">
                              {window.location.origin}/invite/{displayToken}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Created {link.created_at ? new Date(link.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "recently"}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-semibold border shadow-sm",
                              isExpired 
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : "bg-amber-500/10 text-amber-500 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400"
                            )}>
                              {timeRemaining}
                            </span>
                            
                            <Button
                              size="icon"
                              variant="secondary"
                              className={cn(
                                "h-8 w-8 rounded-lg border border-slate-800 transition-all hover:bg-primary hover:text-white",
                                isCopied && "bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/20"
                              )}
                              onClick={() => handleCopy(link.token)}
                            >
                              {isCopied ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
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

