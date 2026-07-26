"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, Edit, Printer, Trash2, User, Phone, MapPin, Briefcase, 
  GraduationCap, Calendar, Heart, ShieldAlert, Church, Gift, Check,
  BookOpen, Award, Sparkles, Building, Layers, School, AlertTriangle, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils/utils"
import { deleteMember } from "@/app/(dashboard)/members/actions"

type EducationDetail = {
  level: string
  school_name: string
  year_started: string
  year_graduated: string
  is_currently_enrolled: boolean
}

type SiblingDetail = {
  name: string
  age?: string | number
}

type ChildDetail = {
  id: string
  name: string
  birth_date: string | null
}

type MinistryDetail = {
  id: string
  name: string
  description: string | null
  for_everyone: boolean
}

type CommitmentHistoryItem = {
  year: number
  ministries: string[]
  offerings: string[]
}

type MemberProfileProps = {
  member: any
  childrenList: ChildDetail[]
  ministriesList: MinistryDetail[]
  commitmentsHistory: CommitmentHistoryItem[]
}

export function MemberProfileView({
  member,
  childrenList,
  ministriesList,
  commitmentsHistory,
}: MemberProfileProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "personal" | "family" | "education" | "spiritual" | "commitments">("overview")
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Full Address helper
  const addressParts = [
    member.unit_number ? `Unit ${member.unit_number}` : null,
    member.house_number ? `#${member.house_number}` : null,
    member.street,
    member.barangay ? `Brgy. ${member.barangay}` : null,
    member.city,
    member.province,
    member.zip_code,
    member.country && member.country !== "Philippines" ? member.country : null
  ].filter(Boolean)
  const fullAddress = addressParts.join(", ")

  // Initials for avatar
  const initials = `${member.first_name?.[0] || ""}${member.last_name?.[0] || ""}`.toUpperCase()

  // Calculate age if not explicitly set
  let computedAge = member.age
  if (!computedAge && member.birth_date) {
    const birthYear = new Date(member.birth_date).getFullYear()
    if (!isNaN(birthYear)) {
      computedAge = new Date().getFullYear() - birthYear
    }
  }

  // Parse JSONB arrays safely
  const educationDetails: EducationDetail[] = Array.isArray(member.education_details) ? member.education_details : []
  const siblings: SiblingDetail[] = Array.isArray(member.siblings) ? member.siblings : []

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteMember(member.id)
    } catch (e) {
      console.error(e)
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* SCREEN TOP ACTION BAR (Hidden on Print) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-muted">
            <Link href="/members">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Member Profile</h1>
            <p className="text-xs text-muted-foreground">Detailed record and church commitments history</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print Profile</span>
          </Button>
          <Button size="sm" asChild className="gap-2">
            <Link href={`/members/${member.id}/edit`}>
              <Edit className="h-4 w-4" />
              <span>Edit Profile</span>
            </Link>
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            className="gap-2"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Delete Member Record</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <strong className="text-foreground">{member.first_name} {member.last_name}</strong>? This action will permanently remove their profile and all associated commitment history.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
                className="gap-2"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* PRINT HEADER (Visible only when printed) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="hidden print:block text-center mb-6 pb-4 border-b">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">CBT Directory</h1>
        <p className="text-sm text-muted-foreground">Official Church Member Profile Record</p>
        <p className="text-xs text-muted-foreground mt-1">Generated on: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* HERO / MEMBER HEADER CARD */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Card className="overflow-hidden border shadow-sm">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-700 dark:from-slate-800 dark:via-indigo-950 dark:to-slate-900 h-24 sm:h-32 relative" />
        <CardContent className="pt-0 relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 mb-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              {/* Avatar circle */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-card border-4 border-card shadow-lg flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-primary text-3xl font-extrabold tracking-wider -mt-12 sm:-mt-14 shrink-0">
                {initials || <User className="h-12 w-12" />}
              </div>
              
              <div className="space-y-1 pb-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    {member.first_name} {member.middle_name ? `${member.middle_name} ` : ""}{member.last_name}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                  {member.sex && (
                    <span className="px-2.5 py-0.5 rounded-full font-medium bg-secondary text-secondary-foreground border">
                      {member.sex}
                    </span>
                  )}
                  {computedAge !== null && computedAge !== undefined && (
                    <span className="px-2.5 py-0.5 rounded-full font-medium bg-secondary text-secondary-foreground border">
                      {computedAge} yrs old
                    </span>
                  )}
                  {member.marital_status && (
                    <span className="px-2.5 py-0.5 rounded-full font-medium bg-primary/10 text-primary border border-primary/20">
                      {member.marital_status}
                    </span>
                  )}
                  {member.employment_status && (
                    <span className="px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {member.employment_status}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency Tag in Hero */}
            {member.emergency_contact_number && (
              <div className="w-full sm:w-auto bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3 text-xs">
                <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <span className="font-semibold text-amber-700 dark:text-amber-300 block">Emergency Contact</span>
                  <span className="text-muted-foreground">{member.emergency_contact_name || "Contact"} ({member.emergency_contact_relationship || "Relation"}): </span>
                  <a href={`tel:${member.emergency_contact_number}`} className="font-medium text-foreground hover:underline">
                    {member.emergency_contact_number}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Quick Info Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t text-xs">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">
                {member.contact_number ? (
                  <a href={`tel:${member.contact_number}`} className="hover:underline text-foreground font-medium">
                    {member.contact_number}
                  </a>
                ) : (
                  "No phone number"
                )}
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate text-foreground font-medium">
                {fullAddress || "No address specified"}
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Briefcase className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate text-foreground font-medium">
                {member.occupation || member.position || (member.employment_status === "Student" ? "Student" : "Not specified")}
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-muted-foreground">
              <GraduationCap className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate text-foreground font-medium">
                {member.highest_educational_attainment || "Not specified"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TABS NAVIGATION (Hidden on Print) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex border-b overflow-x-auto scrollbar-none gap-2 sm:gap-6 print:hidden">
        {[
          { id: "overview", label: "Overview", icon: Layers },
          { id: "personal", label: "Personal & Address", icon: User },
          { id: "family", label: "Family", icon: Heart },
          { id: "education", label: "Education & Work", icon: GraduationCap },
          { id: "spiritual", label: "Church & Spiritual", icon: Church },
          { id: "commitments", label: `Commitments (${commitmentsHistory.length})`, icon: Gift },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 py-3 px-3 sm:px-1 font-medium text-sm border-b-2 transition-colors whitespace-nowrap",
                isActive
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB CONTENT SECTIONS (Interactive Screen View) */}
      {/* ───────────────────────────────────────────────────────────── */}

      {/* 1. OVERVIEW TAB */}
      {(activeTab === "overview" || false) && (
        <div className="grid gap-6 md:grid-cols-2 print:hidden">
          {/* Active Ministries Badge Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Church className="h-5 w-5 text-primary" /> Active Ministries
                </CardTitle>
                <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">
                  {ministriesList.length} Enrolled
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {ministriesList.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-2">No active ministries assigned.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {ministriesList.map((m) => (
                    <div 
                      key={m.id} 
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground border text-xs font-medium"
                    >
                      <Check className="h-3.5 w-3.5 text-primary" />
                      <span>{m.name}</span>
                      {m.for_everyone && (
                        <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.2 rounded font-normal ml-1">
                          All
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contact Highlight Card */}
          <Card className="shadow-sm border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <ShieldAlert className="h-5 w-5" /> Emergency Contact Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-amber-500/20 pb-2">
                <span className="text-muted-foreground">Full Name</span>
                <span className="font-semibold">{member.emergency_contact_name || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-amber-500/20 pb-2">
                <span className="text-muted-foreground">Relationship</span>
                <span className="font-semibold">{member.emergency_contact_relationship || "—"}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Contact Number</span>
                {member.emergency_contact_number ? (
                  <a href={`tel:${member.emergency_contact_number}`} className="font-bold text-primary hover:underline">
                    {member.emergency_contact_number}
                  </a>
                ) : (
                  <span>—</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Personal Summary Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Key Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Birth Date</p>
                  <p className="font-medium">{member.birth_date || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Birth Place</p>
                  <p className="font-medium">{member.birth_place || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Civil / Marital Status</p>
                  <p className="font-medium">{member.marital_status || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gender / Sex</p>
                  <p className="font-medium">{member.sex || "—"}</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">Full Address</p>
                <p className="font-medium mt-0.5">{fullAddress || "—"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Spiritual Summary Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Spiritual Milestone Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Membership Date</p>
                  <p className="font-semibold text-primary">{member.membership_date || (member.created_at ? new Date(member.created_at).toISOString().split("T")[0] : "—")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date Saved</p>
                  <p className="font-medium">{member.date_saved || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date Baptized</p>
                  <p className="font-medium">{member.date_baptized || member.baptism_date || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Baptized By</p>
                  <p className="font-medium">{member.baptized_by || "—"}</p>
                </div>
                <div className="col-span-2 pt-2 border-t flex items-center justify-between">
                  <p className="text-xs text-muted-foreground font-medium">Years in CBT</p>
                  <span className="font-bold text-sm text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                    {(() => {
                      const targetDate = member.membership_date || member.date_saved || member.baptism_date || (member.created_at ? new Date(member.created_at).toISOString().split("T")[0] : null)
                      if (targetDate) {
                        const date = new Date(targetDate)
                        if (!isNaN(date.getTime())) {
                          const today = new Date()
                          let years = today.getFullYear() - date.getFullYear()
                          const m = today.getMonth() - date.getMonth()
                          if (m < 0 || (m === 0 && today.getDate() < date.getDate())) years--
                          const y = Math.max(0, years)
                          return `${y} ${y === 1 ? "year" : "years"}`
                        }
                      }
                      return member.years_in_church !== null && member.years_in_church !== undefined ? `${member.years_in_church} years` : "0 years"
                    })()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. PERSONAL & ADDRESS TAB */}
      {(activeTab === "personal" || false) && (
        <Card className="shadow-sm print:hidden">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Personal Profile & Residential Address
            </CardTitle>
            <CardDescription>Comprehensive identification and location information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Data */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 border-b pb-1">
                Personal Data
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs">First Name</span>
                  <span className="font-medium">{member.first_name || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Middle Name</span>
                  <span className="font-medium">{member.middle_name || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Last Name</span>
                  <span className="font-medium">{member.last_name || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Sex / Gender</span>
                  <span className="font-medium">{member.sex || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Birth Date</span>
                  <span className="font-medium">{member.birth_date || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Calculated Age</span>
                  <span className="font-medium">{computedAge !== null ? `${computedAge} years old` : "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Place of Birth</span>
                  <span className="font-medium">{member.birth_place || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Marital Status</span>
                  <span className="font-medium">{member.marital_status || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Contact Mobile Number</span>
                  <span className="font-medium">{member.contact_number || "—"}</span>
                </div>
              </div>
            </div>

            {/* Address Breakdown */}
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 border-b pb-1">
                  Current Residence Address
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs">House / Lot No.</span>
                    <span className="font-medium">{member.house_number || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Unit / Apt No.</span>
                    <span className="font-medium">{member.unit_number || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Street</span>
                    <span className="font-medium">{member.street || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Barangay</span>
                    <span className="font-medium">{member.barangay || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">City / Municipality</span>
                    <span className="font-medium">{member.city || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Province</span>
                    <span className="font-medium">{member.province || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Zip Code</span>
                    <span className="font-medium">{member.zip_code || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Country</span>
                    <span className="font-medium">{member.country || "Philippines"}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 border-b pb-1">
                  Permanent Address
                </h4>
                {member.is_perm_same_as_current ? (
                  <p className="text-sm text-muted-foreground italic bg-muted/20 p-3 rounded-lg border">
                    Same as Current Residence Address above.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs">House / Lot No.</span>
                      <span className="font-medium">{member.perm_house_number || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Unit / Apt No.</span>
                      <span className="font-medium">{member.perm_unit_number || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Street</span>
                      <span className="font-medium">{member.perm_street || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Barangay</span>
                      <span className="font-medium">{member.perm_barangay || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">City / Municipality</span>
                      <span className="font-medium">{member.perm_city || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Province</span>
                      <span className="font-medium">{member.perm_province || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Zip Code</span>
                      <span className="font-medium">{member.perm_zip_code || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Country</span>
                      <span className="font-medium">{member.perm_country || "Philippines"}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. FAMILY TAB */}
      {(activeTab === "family" || false) && (
        <div className="space-y-6 print:hidden">
          {/* Parents Information */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" /> Parents & Marital Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Father */}
                <div className="p-4 rounded-xl border bg-muted/30 space-y-2 text-sm">
                  <h4 className="font-bold text-primary flex items-center gap-2">
                    <User className="h-4 w-4" /> Father's Details
                  </h4>
                  <div className="space-y-1">
                    <p><span className="text-muted-foreground text-xs block">Full Name</span> <span className="font-medium">{member.father_name || "—"}</span></p>
                    <p><span className="text-muted-foreground text-xs block">Occupation</span> <span className="font-medium">{member.father_occupation || "—"}</span></p>
                    <p><span className="text-muted-foreground text-xs block">Contact Number</span> <span className="font-medium">{member.father_contact_number || "—"}</span></p>
                  </div>
                </div>

                {/* Mother */}
                <div className="p-4 rounded-xl border bg-muted/30 space-y-2 text-sm">
                  <h4 className="font-bold text-primary flex items-center gap-2">
                    <User className="h-4 w-4" /> Mother's Details
                  </h4>
                  <div className="space-y-1">
                    <p><span className="text-muted-foreground text-xs block">Full Name</span> <span className="font-medium">{member.mother_name || "—"}</span></p>
                    <p><span className="text-muted-foreground text-xs block">Occupation</span> <span className="font-medium">{member.mother_occupation || "—"}</span></p>
                    <p><span className="text-muted-foreground text-xs block">Contact Number</span> <span className="font-medium">{member.mother_contact_number || "—"}</span></p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-sm border-t">
                <div>
                  <span className="text-muted-foreground text-xs block">Parents' Civil Status</span>
                  <span className="font-medium">{member.parents_civil_status || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Spouse Name</span>
                  <span className="font-medium">{member.spouse_name || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Anniversary Date</span>
                  <span className="font-medium">{member.anniversary_date || "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Children & Siblings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Children List */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  Children ({childrenList.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {childrenList.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No children recorded.</p>
                ) : (
                  <ul className="divide-y text-sm">
                    {childrenList.map((c) => (
                      <li key={c.id} className="py-2 flex justify-between items-center">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {c.birth_date ? `DOB: ${c.birth_date}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Siblings List */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  Siblings ({siblings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {siblings.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No siblings recorded.</p>
                ) : (
                  <ul className="divide-y text-sm">
                    {siblings.map((s, idx) => (
                      <li key={idx} className="py-2 flex justify-between items-center">
                        <span className="font-medium">{s.name}</span>
                        {s.age && <span className="text-xs text-muted-foreground">{s.age} yrs old</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 4. EDUCATION & WORK TAB */}
      {(activeTab === "education" || false) && (
        <div className="space-y-6 print:hidden">
          {/* Work / Employment Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" /> Employment & Academic Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-muted-foreground text-xs block">Employment Status</span>
                  <span className="font-medium">{member.employment_status || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Occupation</span>
                  <span className="font-medium">{member.occupation || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Company / Organization</span>
                  <span className="font-medium">{member.company || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Position / Role</span>
                  <span className="font-medium">{member.position || "—"}</span>
                </div>
              </div>

              {/* Student details if student */}
              {member.employment_status === "Student" && (
                <div className="p-4 rounded-xl border bg-blue-500/5 border-blue-500/20 space-y-2 mt-2">
                  <h5 className="font-semibold text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Student Details
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <span className="text-muted-foreground text-xs block">School / University</span>
                      <span className="font-medium">{member.student_school || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block">Year Level</span>
                      <span className="font-medium">{member.student_year_level || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block">Course / Track</span>
                      <span className="font-medium">{member.student_course || "—"}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Education Details List */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" /> Educational Background History
                </CardTitle>
                {member.highest_educational_attainment && (
                  <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold border border-primary/20">
                    Highest: {member.highest_educational_attainment}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {educationDetails.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No detailed education history records.</p>
              ) : (
                <div className="space-y-3">
                  {educationDetails.map((edu, idx) => (
                    <div key={idx} className="p-4 rounded-xl border bg-card shadow-2xs space-y-1 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-base text-foreground">{edu.level}</span>
                        {edu.is_currently_enrolled ? (
                          <span className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-medium">
                            Currently Enrolled
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {edu.year_started ? `${edu.year_started} - ${edu.year_graduated || "Present"}` : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground">
                        <School className="h-4 w-4 inline mr-1 text-primary" />
                        {edu.school_name || "School name not recorded"}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {member.awards_honors && (
                <div className="pt-4 border-t space-y-1">
                  <h5 className="font-semibold text-xs text-muted-foreground flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-amber-500" /> Academic Awards & Honors
                  </h5>
                  <p className="text-sm font-medium">{member.awards_honors}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. SPIRITUAL TAB */}
      {(activeTab === "spiritual" || false) && (
        <Card className="shadow-sm print:hidden">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Church className="h-5 w-5 text-primary" /> Church & Spiritual Information
            </CardTitle>
            <CardDescription>Baptism, salvation, and local church membership details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            {/* Salvation & Baptism */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 border-b pb-1">
                Salvation & Water Baptism
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-muted-foreground text-xs block">Date Saved</span>
                  <span className="font-medium">{member.date_saved || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Witnessed By</span>
                  <span className="font-medium">{member.witnessed_by || member.witness_by || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Date Baptized</span>
                  <span className="font-medium">{member.date_baptized || member.baptism_date || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Baptized By</span>
                  <span className="font-medium">{member.baptized_by || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Place of Baptism</span>
                  <span className="font-medium">{member.place_of_baptism || "—"}</span>
                </div>
              </div>
            </div>

            {/* Local Church Membership */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 border-b pb-1">
                Church History & Membership
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-muted-foreground text-xs block">Current Local Church</span>
                  <span className="font-medium">{member.current_church || "CBT"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Years in Current Church</span>
                  <span className="font-medium">{member.years_in_church ? `${member.years_in_church} years` : "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Previous Church Name</span>
                  <span className="font-medium">{member.prev_church_name || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Years in Previous Church</span>
                  <span className="font-medium">{member.prev_church_years ? `${member.prev_church_years} years` : "—"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 6. COMMITMENTS TAB */}
      {(activeTab === "commitments" || false) && (
        <Card className="shadow-sm print:hidden">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" /> Yearly Recommitment & Offering History
            </CardTitle>
            <CardDescription>Record of annual ministry commitments and offering category pledges</CardDescription>
          </CardHeader>
          <CardContent>
            {commitmentsHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4">
                No annual commitment records found for this member yet.
              </p>
            ) : (
              <div className="space-y-6">
                {commitmentsHistory.map((item) => (
                  <div key={item.year} className="p-4 rounded-xl border bg-card shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="font-bold text-lg text-primary">{item.year} Commitment</span>
                      <span className="text-xs text-muted-foreground font-medium">Annual Record</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {/* Ministries */}
                      <div>
                        <h5 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">
                          Committed Ministries ({item.ministries.length})
                        </h5>
                        {item.ministries.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">No ministry commitments</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {item.ministries.map((mName, idx) => (
                              <span key={idx} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-md font-medium">
                                ⛪ {mName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Offerings */}
                      <div>
                        <h5 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">
                          Pledged Offering Categories ({item.offerings.length})
                        </h5>
                        {item.offerings.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">No offering pledges</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {item.offerings.map((oName, idx) => (
                              <span key={idx} className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-md font-medium">
                                🎁 {oName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* FULL PRINT VIEW DOCUMENT (Visible ONLY when printing) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="hidden print:block space-y-6 text-black text-sm">
        <div className="grid grid-cols-2 gap-4 border p-4 rounded">
          <div>
            <p><strong>Full Name:</strong> {member.first_name} {member.middle_name} {member.last_name}</p>
            <p><strong>Sex / Gender:</strong> {member.sex || "—"}</p>
            <p><strong>Birth Date:</strong> {member.birth_date || "—"}</p>
            <p><strong>Calculated Age:</strong> {computedAge !== null ? `${computedAge} yrs` : "—"}</p>
            <p><strong>Contact Number:</strong> {member.contact_number || "—"}</p>
          </div>
          <div>
            <p><strong>Marital Status:</strong> {member.marital_status || "—"}</p>
            <p><strong>Employment Status:</strong> {member.employment_status || "—"}</p>
            <p><strong>Occupation:</strong> {member.occupation || "—"}</p>
            <p><strong>Highest Education:</strong> {member.highest_educational_attainment || "—"}</p>
            <p><strong>Emergency Contact:</strong> {member.emergency_contact_name} ({member.emergency_contact_number})</p>
          </div>
        </div>

        <div className="border p-4 rounded space-y-1">
          <p><strong>Complete Address:</strong> {fullAddress || "—"}</p>
        </div>

        {/* Ministries Enrolled */}
        <div className="border p-4 rounded space-y-2">
          <h3 className="font-bold text-base border-b pb-1">Active Church Ministries</h3>
          <p>{ministriesList.map(m => m.name).join(", ") || "None enrolled"}</p>
        </div>

        {/* Commitment History */}
        <div className="border p-4 rounded space-y-2">
          <h3 className="font-bold text-base border-b pb-1">Annual Recommitments History</h3>
          {commitmentsHistory.map(c => (
            <div key={c.year} className="text-xs border-b pb-1">
              <p><strong>Year {c.year}:</strong></p>
              <p>Ministries: {c.ministries.join(", ") || "None"}</p>
              <p>Offering Pledges: {c.offerings.join(", ") || "None"}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
