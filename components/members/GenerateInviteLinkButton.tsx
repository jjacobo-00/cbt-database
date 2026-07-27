"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Link2, Loader2, Check } from "lucide-react"
import { generateInviteLink } from "@/app/(dashboard)/members/actions"
import { toast } from "sonner"

export function GenerateInviteLinkButton({ memberId, variant = "outline", className }: { memberId?: string, variant?: "default" | "outline" | "ghost" | "secondary", className?: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    try {
      setIsLoading(true)
      const token = await generateInviteLink(memberId)
      
      const url = `${window.location.origin}/invite/${token}`
      await navigator.clipboard.writeText(url)
      
      setCopied(true)
      toast.success(memberId ? "Edit link copied! Expires in 30 mins." : "Registration link copied! Expires in 30 mins.")
      
      setTimeout(() => setCopied(false), 3000)
    } catch (e) {
      toast.error("Failed to generate link")
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant={variant}
      onClick={handleGenerate} 
      disabled={isLoading || copied}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : copied ? (
        <Check className="h-4 w-4 mr-2 text-green-500" />
      ) : (
        <Link2 className="h-4 w-4 mr-2" />
      )}
      {copied ? "Copied!" : memberId ? "Generate Update Link" : "Share Invite Link"}
    </Button>
  )
}
