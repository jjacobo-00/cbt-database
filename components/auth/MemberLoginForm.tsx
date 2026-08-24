"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, KeyRound, Loader2, ArrowRight, UserCheck, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react"
import { requestMemberOtp, loginMemberWithOtp } from "@/app/(auth)/login/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { formatName, formatFullName, formatSuffix, calculateAge } from "@/lib/utils/utils"

interface SharedMember {
  id: string
  first_name: string
  middle_name?: string | null
  last_name: string
  suffix?: string | null
  birth_date?: string | null
  church_role: string | null
}

export function MemberLoginForm() {
  const router = useRouter()
  const [step, setStep] = useState<"email" | "select_member" | "otp">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [sharedMembers, setSharedMembers] = useState<SharedMember[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(undefined)

  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [infoMsg, setInfoMsg] = useState<string | null>(null)

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    setErrorMsg(null)
    setInfoMsg(null)

    try {
      const res = await requestMemberOtp(email)
      if (!res.success) {
        setErrorMsg(res.error || "Failed to send code.")
        return
      }

      if (res.members && res.members.length > 1) {
        setSharedMembers(res.members)
        setSelectedMemberId(res.members[0].id)
        setStep("select_member")
      } else {
        setStep("otp")
      }

      setInfoMsg("A 6-digit verification code has been sent to your email.")
      toast.success("Verification code sent to your email!")
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || code.length < 6) {
      setErrorMsg("Please enter the complete 6-digit code.")
      return
    }

    setIsLoading(true)
    setErrorMsg(null)

    try {
      const res = await loginMemberWithOtp(email, code, selectedMemberId)
      if (!res.success) {
        setErrorMsg(res.error || "Invalid or expired code.")
        setIsLoading(false)
        return
      }

      toast.success("Welcome back! Redirecting to your profile...")
      router.push("/my-profile")
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log in.")
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs font-medium flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {infoMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-start gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{infoMsg}</span>
        </div>
      )}

      {step === "email" && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member-email" className="text-xs font-semibold text-foreground">
              Member Registered Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="member-email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-9 h-10 text-sm bg-background"
                disabled={isLoading}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Enter the email address registered with CBT Olongapo to receive a 6-digit login code.
            </p>
          </div>

          <Button type="submit" className="w-full h-10 font-semibold gap-2" disabled={isLoading || !email.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sending Code...
              </>
            ) : (
              <>
                Send Verification Code <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      )}

      {step === "select_member" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">Select Member Profile</Label>
            <p className="text-xs text-muted-foreground">
              Multiple member profiles were found for this email address. Please select your profile:
            </p>
            <div className="space-y-2 pt-1">
              {sharedMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMemberId(m.id)}
                  className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                    selectedMemberId === m.id
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-sm font-medium flex items-center gap-1.5 flex-wrap">
                        <span>{formatName(`${m.first_name} ${m.last_name}`)}</span>
                        {m.suffix && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary/15 text-primary border border-primary/30 shrink-0">
                            {formatSuffix(m.suffix)}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {m.church_role || "Member"}
                        {m.birth_date ? ` • Born ${String(m.birth_date).split("T")[0].split("-")[0]}` : ""}
                      </div>
                    </div>
                  </div>
                  {selectedMemberId === m.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setStep("otp")}
            className="w-full h-10 font-semibold gap-2"
            disabled={!selectedMemberId}
          >
            Continue with Selected Profile <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="otp-code" className="text-xs font-semibold text-foreground">
                6-Digit Login Code
              </Label>
              <button
                type="button"
                onClick={() => {
                  setStep("email")
                  setCode("")
                }}
                className="text-[11px] text-primary hover:underline"
              >
                Change Email
              </button>
            </div>

            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="otp-code"
                type="text"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
                className="pl-9 h-10 text-center tracking-[6px] text-lg font-bold bg-background"
                disabled={isLoading}
                autoFocus
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Code sent to <span className="font-medium text-foreground">{email}</span>. Valid for 10 minutes.
            </p>
          </div>

          <Button type="submit" className="w-full h-10 font-semibold gap-2" disabled={isLoading || code.length < 6}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
              </>
            ) : (
              <>Verify & View My Profile</>
            )}
          </Button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={isLoading}
              className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="h-3 w-3" /> Resend Code
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
