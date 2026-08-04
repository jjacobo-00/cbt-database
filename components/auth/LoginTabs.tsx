"use client";

import React, { useState } from "react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { MemberLoginForm } from "@/components/auth/MemberLoginForm";
import { Sparkles, Mail, ChevronDown, ChevronUp } from "lucide-react";

export function LoginTabs() {
  const [showOtp, setShowOtp] = useState(false);

  return (
    <div className="space-y-5">
      {/* Primary 1-Click Google Login */}
      <div className="space-y-3">
        <GoogleSignInButton />
        <p className="text-[11px] text-center text-muted-foreground">
          CBT members can sign in with 1-click using their registered Google
          email.
        </p>
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-border w-full" />
        <span className="bg-card px-3 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          or
        </span>
        <div className="border-t border-border w-full" />
      </div>

      {/* Secondary OTP Option */}
      <div>
        <button
          type="button"
          onClick={() => setShowOtp(!showOtp)}
          className="w-full py-2.5 px-4 rounded-xl border bg-muted/30 hover:bg-muted/60 transition-all flex items-center justify-between text-xs font-semibold text-foreground group"
        >
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
            <span>Log in with Email Code (OTP)</span>
          </div>
          {showOtp ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showOtp && (
          <div className="pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <MemberLoginForm />
          </div>
        )}
      </div>
    </div>
  );
}
