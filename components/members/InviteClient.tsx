"use client"

import React, { useState } from "react"
import { MemberForm } from "@/components/members/MemberForm"
import { submitInviteForm, verifyDobAndGetMember } from "@/app/(dashboard)/members/actions"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Lock, CheckCircle2, Sparkles } from "lucide-react"

export function InviteClient({ 
  token, 
  inviteDetails,
  ministries,
  offeringCategories,
  allMembers
}: { 
  token: string
  inviteDetails: any
  ministries: any[]
  offeringCategories: any[]
  allMembers: any[]
}) {
  const [isVerified, setIsVerified] = useState(inviteDetails.type === "new")
  const [memberData, setMemberData] = useState<any>(null)
  const [dobInput, setDobInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await verifyDobAndGetMember(token, dobInput)
      if (res.error) {
        toast.error(res.error)
      } else {
        setMemberData(res.member)
        setIsVerified(true)
      }
    } catch (e) {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (payload: string) => {
    await submitInviteForm(token, payload)
    setIsSuccess(true)
  }

  if (inviteDetails.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold text-destructive">Link Invalid or Expired</h1>
        <p className="text-muted-foreground mt-2">This registration link is no longer valid. Please request a new one.</p>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-card">
        <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
        <h1 className="text-2xl font-bold">Successfully Submitted!</h1>
        <p className="text-muted-foreground mt-2">Thank you! Your profile has been saved.</p>
        <p className="text-sm mt-8 text-muted-foreground">You may now close this page.</p>
      </div>
    )
  }

  if (!isVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
        <Card className="w-full max-w-md shadow-lg border-primary/20">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Security Check</CardTitle>
            <CardDescription>
              To update the profile for <strong>{inviteDetails.first_name} {inviteDetails.last_name}</strong>, please verify your identity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date of Birth</label>
                <DatePicker 
                  value={dobInput}
                  onChange={setDobInput}
                  className="h-12 w-full"
                />
              </div>
              <Button type="submit" className="w-full h-12" disabled={isLoading || !dobInput}>
                {isLoading ? "Verifying..." : "Unlock Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-tight">
          {inviteDetails.type === "new" ? "Member Registration" : "Update Profile"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Please fill out the form below. Your progress is auto-saved locally.
        </p>
      </div>

      {(inviteDetails.preset_role || inviteDetails.mission_name) && (
        <div className="mb-6 p-4 rounded-xl border bg-primary/5 border-primary/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Registration Assignment</p>
              <p className="text-sm font-bold text-foreground">
                {inviteDetails.mission_name ? `Mission: ${inviteDetails.mission_name}` : "CBT Olongapo"}
                {inviteDetails.preset_role ? ` — Role: ${inviteDetails.preset_role}` : ""}
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20">
            Pre-configured Link
          </span>
        </div>
      )}

      <div className="bg-card border rounded-xl shadow-sm p-4 sm:p-8">
        <MemberForm 
          initialData={memberData} 
          ministries={ministries}
          offeringCategories={offeringCategories}
          allMembers={allMembers}
          onSubmitOverride={handleSubmit}
          hideBackButton={true}
          isInvite={true}
        />
      </div>
    </div>
  )
}
