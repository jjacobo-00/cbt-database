"use client"

import React, { useState } from "react"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
import { MemberLoginForm } from "@/components/auth/MemberLoginForm"
import { UserCheck, ShieldCheck } from "lucide-react"

export function LoginTabs() {
  const [activeTab, setActiveTab] = useState<"member" | "admin">("member")

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-xl border border-border/60">
        <button
          type="button"
          onClick={() => setActiveTab("member")}
          className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "member"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCheck className="h-3.5 w-3.5" /> Member Login
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("admin")}
          className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "admin"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" /> Staff / Admin
        </button>
      </div>

      {activeTab === "member" ? (
        <div className="space-y-3 animate-in fade-in">
          <div className="text-center space-y-1 pb-1">
            <h3 className="text-sm font-semibold text-foreground">Member Self-Service</h3>
            <p className="text-xs text-muted-foreground">
              Log in with your registered email to view your membership details.
            </p>
          </div>
          <MemberLoginForm />
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in pt-1">
          <div className="text-center space-y-1 pb-1">
            <h3 className="text-sm font-semibold text-foreground">Staff & Pastor Access</h3>
            <p className="text-xs text-muted-foreground">
              Sign in with your authorized Google account to manage the database.
            </p>
          </div>
          <GoogleSignInButton />
        </div>
      )}
    </div>
  )
}
