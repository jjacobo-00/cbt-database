"use server"

import { signIn } from "@/auth"
import { db } from "@/db"
import { members, verificationTokens } from "@/db/schema"
import { ilike, eq } from "drizzle-orm"
import { sendOtpEmail } from "@/lib/resend"

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/dashboard" })
}

export async function requestMemberOtp(rawEmail: string) {
  try {
    const email = rawEmail.trim().toLowerCase()
    if (!email || !email.includes("@")) {
      return { success: false, error: "Please provide a valid email address." }
    }

    // Find member(s) registered with this email
    const matchingMembers = await db
      .select({
        id: members.id,
        first_name: members.first_name,
        middle_name: members.middle_name,
        last_name: members.last_name,
        suffix: members.suffix,
        birth_date: members.birth_date,
        church_role: members.church_role,
      })
      .from(members)
      .where(ilike(members.email, email))

    if (!matchingMembers || matchingMembers.length === 0) {
      return {
        success: false,
        error: "No member profile found with this email. Please check your spelling or contact a church admin.",
      }
    }

    // Generate secure 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Delete existing tokens for this email to avoid clutter
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email))

    // Insert new token
    await db.insert(verificationTokens).values({
      identifier: email,
      token: otpCode,
      expires,
    })

    // Deliver OTP email via Resend / Gmail SMTP
    const primaryName = matchingMembers.length === 1 ? matchingMembers[0].first_name : "Member"
    await sendOtpEmail(email, otpCode, primaryName)

    return {
      success: true,
      members: matchingMembers.length > 1 ? matchingMembers : [],
    }
  } catch (err: any) {
    console.error("[requestMemberOtp error]", err)
    return { success: false, error: err.message || "Failed to send verification code." }
  }
}

export async function loginMemberWithOtp(email: string, code: string, rawMemberId?: string) {
  try {
    const cleanEmail = email.trim().toLowerCase()
    const cleanCode = code.trim()
    const cleanMemberId =
      rawMemberId && rawMemberId !== "undefined" && rawMemberId !== "null" && rawMemberId.trim() !== ""
        ? rawMemberId.trim()
        : undefined

    const credentialsPayload: Record<string, string> = {
      email: cleanEmail,
      code: cleanCode,
    }

    if (cleanMemberId) {
      credentialsPayload.memberId = cleanMemberId
    }

    await signIn("otp", {
      ...credentialsPayload,
      redirect: false,
    })

    return { success: true, redirectTo: "/my-profile" }
  } catch (err: any) {
    console.error("[loginMemberWithOtp error]", err)
    let errorMsg = "Invalid or expired verification code."
    if (err?.cause?.err?.message) {
      errorMsg = err.cause.err.message
    } else if (err?.message && !err.message.includes("NEXT_REDIRECT")) {
      errorMsg = err.message
    }
    return { success: false, error: errorMsg }
  }
}
