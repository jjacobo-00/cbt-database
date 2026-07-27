"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Link2, Loader2, Check, Copy, Plus } from "lucide-react"
import { generateInviteLink, getActiveInvitationLinks } from "@/app/(dashboard)/members/actions"
import { toast } from "sonner"
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
        <DialogContent className="max-w-md w-full p-6">
          <DialogHeader>
            <DialogTitle>
              {memberId ? "Share Profile Update Link" : "Share Registration Link"}
            </DialogTitle>
            <DialogDescription>
              Any active link allows self-service form submission for up to 30 minutes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full gap-2 h-11"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Generate New Form Link
            </Button>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b text-xs font-semibold text-muted-foreground flex justify-between">
                <span>Active Links</span>
                <span>Time Left</span>
              </div>
              
              <div className="divide-y max-h-[240px] overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 text-center text-sm text-muted-foreground flex justify-center items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
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
                    
                    return (
                      <div 
                        key={link.token} 
                        className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-mono truncate text-muted-foreground">
                            {window.location.origin}/invite/{link.token.substring(0, 12)}...
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Created {link.created_at ? new Date(link.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "recently"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                            {timeRemaining}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleCopy(link.token)}
                          >
                            {isCopied ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
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
        </DialogContent>
      </Dialog>
    </>
  )
}

