"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, Edit, Printer, Trash2, User, Phone, MapPin, Briefcase, 
  GraduationCap, Calendar, Heart, ShieldAlert, Church, Gift, Check,
  BookOpen, Award, Sparkles, Building, Layers, School, AlertTriangle, Loader2, Mail, Users, MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils/utils"
import { deleteMember } from "@/app/(dashboard)/members/actions"
import { GenerateInviteLinkButton } from "@/components/members/GenerateInviteLinkButton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

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
  birth_date?: string
  sibling_member_id?: string | null
}

type ChildDetail = {
  id: string
  name: string
  birth_date: string | null
  child_member_id?: string | null
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

  const permAddressParts = [
    member.perm_unit_number ? `Unit ${member.perm_unit_number}` : null,
    member.perm_house_number ? `#${member.perm_house_number}` : null,
    member.perm_street,
    member.perm_barangay ? `Brgy. ${member.perm_barangay}` : null,
    member.perm_city,
    member.perm_province,
    member.perm_zip_code,
    member.perm_country && member.perm_country !== "Philippines" ? member.perm_country : null
  ].filter(Boolean)
  const fullPermAddress = permAddressParts.join(", ")

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
    <div className="space-y-6 animate-in fade-in duration-300 w-full min-w-0 max-w-full">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* SCREEN TOP ACTION BAR (Hidden on Print) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden w-full min-w-0">
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

        <div className="flex items-center gap-2 flex-wrap min-w-0 w-full sm:w-auto mt-2 sm:mt-0">
          <Button size="sm" asChild className="gap-1.5 px-4 font-medium">
            <Link href={`/members/${member.id}/edit`}>
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <GenerateInviteLinkButton 
                memberId={member.id} 
                asDropdownItem={true}
                className="cursor-pointer font-medium"
              />
              <DropdownMenuItem 
                onClick={() => window.print()}
                className="cursor-pointer font-medium"
              >
                <Printer className="h-4 w-4 mr-2" />
                <span>Print Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteConfirm(true)}
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer font-medium"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span>Delete Profile</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
      {/* HERO / MEMBER HEADER CARD */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Card className="overflow-hidden border shadow-sm print:hidden">
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
                    {member.first_name} {member.middle_name ? `${member.middle_name} ` : ""}{member.last_name}{member.suffix ? ` ${member.suffix}` : ""}
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
            <div className="flex items-start gap-2 text-muted-foreground min-w-0">
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <span className="break-all whitespace-normal leading-tight text-foreground font-medium">
                {member.contact_number ? (
                  <a href={`tel:${member.contact_number}`} className="hover:underline text-foreground font-medium break-all whitespace-normal">
                    {member.contact_number}
                  </a>
                ) : (
                  "No phone number"
                )}
              </span>
            </div>

            <div className="flex items-start gap-2 text-muted-foreground min-w-0">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <span className="break-all whitespace-normal leading-tight text-foreground font-medium">
                {member.email ? (
                  <a href={`mailto:${member.email}`} className="hover:underline text-foreground font-medium break-all whitespace-normal">
                    {member.email}
                  </a>
                ) : (
                  "No email address"
                )}
              </span>
            </div>

            <div className="flex items-start gap-2 text-muted-foreground min-w-0">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span className="text-foreground font-medium break-words whitespace-normal leading-tight">
                {fullAddress || "No address specified"}
              </span>
            </div>

            <div className="flex items-start gap-2 text-muted-foreground min-w-0">
              <Briefcase className="h-4 w-4 text-primary shrink-0" />
              <span className="text-foreground font-medium break-words whitespace-normal leading-tight">
                {member.occupation || member.position || (member.employment_status === "Student" ? "Student" : "Not specified")}
              </span>
            </div>

            <div className="flex items-start gap-2 text-muted-foreground min-w-0">
              <GraduationCap className="h-4 w-4 text-primary shrink-0" />
              <span className="text-foreground font-medium break-words whitespace-normal leading-tight">
                {member.highest_educational_attainment || "Not specified"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TABS NAVIGATION (Hidden on Print) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex border-b overflow-x-auto scrollbar-none gap-2 sm:gap-6 print:hidden w-full max-w-full">
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
        <div className="space-y-6 print:hidden">
          <div className="grid gap-6 md:grid-cols-2 items-start">
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

          {/* Health & Emergency Profile Card */}
          <Card className="shadow-sm border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <ShieldAlert className="h-5 w-5" /> Health & Emergency Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {/* Emergency Contact Block */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-600/70 border-b border-amber-500/20 pb-1 mb-2">Emergency Contact</h4>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Name & Rel.</span>
                  <span className="font-semibold text-right break-words whitespace-normal min-w-0">
                    {member.emergency_contact_name || "—"} {member.emergency_contact_relationship ? `(${member.emergency_contact_relationship})` : ""}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Contact Number</span>
                  {member.emergency_contact_number ? (
                    <a href={`tel:${member.emergency_contact_number}`} className="font-bold text-primary hover:underline text-right break-all whitespace-normal min-w-0">
                      {member.emergency_contact_number}
                    </a>
                  ) : (
                    <span>—</span>
                  )}
                </div>
              </div>

              {/* Medical Information Block */}
              <div className="space-y-2 pt-2 border-t border-amber-500/20">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-600/70 border-b border-amber-500/20 pb-1 mb-2">Medical Information</h4>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Blood Type</span>
                  <span className="font-semibold text-right break-words whitespace-normal min-w-0">{member.blood_type || "—"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Allergies</span>
                  <span className="font-semibold text-right break-words whitespace-normal min-w-0 text-red-600 dark:text-red-400">{member.allergies || "None"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Conditions</span>
                  <span className="font-semibold text-right break-words whitespace-normal min-w-0">{member.medical_conditions || "None"}</span>
                </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Birth Date</p>
                  <p className="font-medium">{member.birth_date || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Birth Place</p>
                  <p className="font-medium">{member.birth_place || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gender / Sex</p>
                  <p className="font-medium">{member.sex || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email Address</p>
                  <p className="font-medium truncate" title={member.email || ""}>{member.email || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Civil / Marital Status</p>
                  <p className="font-medium">
                    {member.marital_status === "Married" ? (
                      `Married to ${member.spouse_name || "Unknown"} (${
                        member.anniversary_date ? (
                          !isNaN(new Date(member.anniversary_date).getFullYear()) ? 
                            `${new Date().getFullYear() - new Date(member.anniversary_date).getFullYear()} years` : "Unknown"
                        ) : "Unknown"
                      })`
                    ) : member.marital_status === "Widowed" && member.widowed_date ? (
                      `Widowed (Since ${member.widowed_date})`
                    ) : (
                      member.marital_status || "—"
                    )}
                  </p>
                </div>
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

          {/* New Full-Width Address Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Location & Addresses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Current Residence
                  </h4>
                  <p className="font-medium break-words whitespace-normal leading-tight">
                    {fullAddress || "No current address specified."}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Permanent Address
                  </h4>
                  <p className="font-medium break-words whitespace-normal leading-tight">
                    {member.is_perm_same_as_current ? (
                      <span className="text-muted-foreground italic">Same as Current Residence</span>
                    ) : (
                      fullPermAddress || "No permanent address specified."
                    )}
                  </p>
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
                <div>
                  <span className="text-muted-foreground block text-xs">Email Address</span>
                  <span className="font-medium break-all whitespace-normal leading-tight">{member.email || "—"}</span>
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

            {/* Health & Medical Data Section */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 border-b pb-1 flex items-center gap-2">
                <Heart className="h-4 w-4" /> Health & Medical Data
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm bg-muted/10 p-4 rounded-xl border border-muted/50">
                <div>
                  <span className="text-muted-foreground block text-xs">Blood Type</span>
                  <span className="font-medium text-destructive">{member.blood_type || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Allergies</span>
                  <span className="font-medium">{member.allergies || "None declared"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Medical Conditions</span>
                  <span className="font-medium">{member.medical_conditions || "None declared"}</span>
                </div>
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
                <Users className="h-5 w-5 text-primary" /> Parents' Information
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
                    <p><span className="text-muted-foreground text-xs block mb-0.5">Full Name</span> <span className="font-medium">
                      {member.father_member_id ? (
                        <Link href={`/members/${member.father_member_id}`} className="text-primary hover:underline">
                          {member.father_name} (Member)
                        </Link>
                      ) : (member.father_name || <span className="text-muted-foreground/50">—</span>)}
                    </span></p>
                    <p><span className="text-muted-foreground text-xs block mb-0.5">Occupation</span> <span className="font-medium">{member.father_occupation || <span className="text-muted-foreground/50">—</span>}</span></p>
                    <p><span className="text-muted-foreground text-xs block mb-0.5">Contact Number</span> <span className="font-medium">{member.father_contact_number || <span className="text-muted-foreground/50">—</span>}</span></p>
                  </div>
                </div>

                {/* Mother */}
                <div className="p-4 rounded-xl border bg-muted/30 space-y-2 text-sm">
                  <h4 className="font-bold text-primary flex items-center gap-2">
                    <User className="h-4 w-4" /> Mother's Details
                  </h4>
                  <div className="space-y-1">
                    <p><span className="text-muted-foreground text-xs block mb-0.5">Full Name</span> <span className="font-medium">
                      {member.mother_member_id ? (
                        <Link href={`/members/${member.mother_member_id}`} className="text-primary hover:underline">
                          {member.mother_name} (Member)
                        </Link>
                      ) : (member.mother_name || <span className="text-muted-foreground/50">—</span>)}
                    </span></p>
                    <p><span className="text-muted-foreground text-xs block mb-0.5">Occupation</span> <span className="font-medium">{member.mother_occupation || <span className="text-muted-foreground/50">—</span>}</span></p>
                    <p><span className="text-muted-foreground text-xs block mb-0.5">Contact Number</span> <span className="font-medium">{member.mother_contact_number || <span className="text-muted-foreground/50">—</span>}</span></p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <span className="text-muted-foreground text-xs block mb-1">Parents' Civil Status</span>
                <span className="font-medium">{member.parents_civil_status || <span className="text-muted-foreground/50">—</span>}</span>
              </div>
            </CardContent>
          </Card>

          {/* Marital Information */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" /> Marital Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                <div className="bg-muted/10 p-4 rounded-xl border border-border/50">
                  <span className="text-muted-foreground text-xs block mb-1">Spouse Name</span>
                  <span className="font-medium">
                    {member.spouse_name ? (
                      member.spouse_member_id ? (
                        <Link href={`/members/${member.spouse_member_id}`} className="text-primary hover:underline">
                          {member.spouse_name} (Member)
                        </Link>
                      ) : (
                        <span>{member.spouse_name} {member.spouse_occupation ? `(${member.spouse_occupation})` : ""}</span>
                      )
                    ) : <span className="text-muted-foreground/50">—</span>}
                  </span>
                </div>
                <div className="bg-muted/10 p-4 rounded-xl border border-border/50">
                  <span className="text-muted-foreground text-xs block mb-1">Anniversary Date</span>
                  <span className="font-medium">{member.anniversary_date || <span className="text-muted-foreground/50">—</span>}</span>
                </div>
                <div className="bg-muted/10 p-4 rounded-xl border border-border/50">
                  <span className="text-muted-foreground text-xs block mb-1">Years Married</span>
                  <span className="font-medium">
                    {member.anniversary_date ? (
                      !isNaN(new Date(member.anniversary_date).getFullYear()) ? 
                        `${new Date().getFullYear() - new Date(member.anniversary_date).getFullYear()} years` : <span className="text-muted-foreground/50">—</span>
                    ) : <span className="text-muted-foreground/50">—</span>}
                  </span>
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
                        <span className="font-medium">
                          {c.child_member_id ? (
                            <Link href={`/members/${c.child_member_id}`} className="text-primary hover:underline">
                              {c.name} (Member)
                            </Link>
                          ) : c.name}
                        </span>
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
                        <span className="font-medium">
                          {s.sibling_member_id ? (
                            <Link href={`/members/${s.sibling_member_id}`} className="text-primary hover:underline">
                              {s.name} (Member)
                            </Link>
                          ) : s.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {s.birth_date ? `DOB: ${s.birth_date}` : (s.age ? `${s.age} yrs old` : "")}
                        </span>
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
      <div className="hidden print:block text-slate-900 bg-white w-full font-sans max-w-4xl mx-auto">
        
        {/* Document Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wider text-black">MEMBER PROFILE</h1>
          <p className="text-sm text-slate-500 mt-1">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>

        {/* Outer Bordered Container */}
        <div className="border border-slate-300 rounded-lg text-sm shadow-sm">
          
          {/* SECTION I: PERSONAL INFO */}
          <div className="bg-slate-100 text-slate-800 font-bold px-3 py-1.5 uppercase text-xs border-b border-slate-300 tracking-wide">
            I. Personal Information
          </div>
          <div className="grid grid-cols-4 divide-x divide-slate-300 border-b border-slate-300">
            <div className="p-2">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Last Name</span>
              <span className="font-semibold text-black">{member.last_name || "—"}</span>
            </div>
            <div className="p-2">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">First Name</span>
              <span className="font-semibold text-black">{member.first_name || "—"}</span>
            </div>
            <div className="p-2">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Middle Name</span>
              <span className="font-semibold text-black">{member.middle_name || "—"}</span>
            </div>
            <div className="p-2">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Suffix</span>
              <span className="font-semibold text-black">{member.suffix || "—"}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-5 divide-x divide-slate-300 border-b border-slate-300">
            <div className="p-2">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Nickname</span>
              <span className="font-semibold text-black">{member.nickname || "—"}</span>
            </div>
            <div className="p-2">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Date of Birth</span>
              <span className="font-semibold text-black">
                {member.birth_date ? new Date(member.birth_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
              </span>
            </div>
            <div className="p-2">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Age</span>
              <span className="font-semibold text-black">{computedAge !== null ? `${computedAge}` : "—"}</span>
            </div>
            <div className="p-2">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Sex</span>
              <span className="font-semibold text-black">{member.sex || "—"}</span>
            </div>
            <div className="p-2">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Civil Status</span>
              <span className="font-semibold text-black">{member.marital_status || "—"}</span>
            </div>
          </div>
          
          {(member.marital_status === "Married" || member.marital_status === "Widow" || member.marital_status === "Widower") && (
            <div className="grid grid-cols-3 divide-x divide-slate-300 border-b border-slate-300 bg-slate-50/50">
              <div className="p-2">
                <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Spouse's Name</span>
                <span className="font-semibold text-black">{member.spouse_name || "—"}</span>
              </div>
              <div className="p-2">
                <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Wedding Anniversary</span>
                <span className="font-semibold text-black">
                  {member.anniversary_date ? new Date(member.anniversary_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                </span>
              </div>
              <div className="p-2">
                <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Years Married</span>
                <span className="font-semibold text-black">
                  {member.anniversary_date ? (() => {
                    const today = new Date();
                    const ann = new Date(member.anniversary_date);
                    let years = today.getFullYear() - ann.getFullYear();
                    if (today.getMonth() < ann.getMonth() || (today.getMonth() === ann.getMonth() && today.getDate() < ann.getDate())) {
                      years--;
                    }
                    return Math.max(0, years) + " yrs";
                  })() : "—"}
                </span>
              </div>
            </div>
          )}

          {(member.marital_status === "Widow" || member.marital_status === "Widower" || member.widowed_date) && (
            <div className="p-2 border-b border-slate-300 bg-slate-50/50">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Widowed Date</span>
              <span className="font-semibold text-black">
                {member.widowed_date ? new Date(member.widowed_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 divide-x divide-slate-300 border-b border-slate-300">
            <div className="p-2">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Place of Birth</span>
              <span className="font-semibold text-black">{member.birth_place || "—"}</span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-300">
              <div className="p-2">
                <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Blood Type</span>
                <span className="font-semibold text-black">{member.blood_type || "—"}</span>
              </div>
              <div className="p-2">
                <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Allergies</span>
                <span className="font-semibold text-black">{member.allergies || "—"}</span>
              </div>
              <div className="p-2">
                <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Med Conditions</span>
                <span className="font-semibold text-black">{member.medical_conditions || "—"}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 divide-x divide-slate-300 border-b border-slate-300">
            <div className="p-2">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Contact No.</span>
              <span className="font-semibold text-black">{member.contact_number || "—"}</span>
            </div>
            <div className="p-2">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Email</span>
              <span className="font-semibold text-black break-all">{member.email || "—"}</span>
            </div>
          </div>

          <div className="border-b border-slate-300">
            <div className="p-2 border-b border-slate-200">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Current Address</span>
              <span className="font-semibold text-black">{fullAddress || "—"}</span>
            </div>
            <div className="p-2">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Permanent Address</span>
              <span className="font-semibold text-black">{member.is_perm_same_as_current ? fullAddress : (
                [
                  member.perm_house_number,
                  member.perm_unit_number,
                  member.perm_street,
                  member.perm_barangay,
                  member.perm_city,
                  member.perm_province,
                  member.perm_zip_code,
                  member.perm_country
                ].filter(Boolean).join(", ") || "—"
              )}</span>
            </div>
          </div>
          {/* SECTION II: EDUCATION & EMPLOYMENT */}
          <div className="bg-slate-100 text-slate-800 font-bold px-3 py-1.5 uppercase text-xs border-b border-slate-300 break-before-avoid tracking-wide">
            II. Education & Employment
          </div>

          <div className="grid grid-cols-2 divide-x divide-slate-300 border-b border-slate-300 break-inside-avoid">
            <div className="p-2">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Latest Education</span>
              <span className="font-semibold text-black">
                {educationDetails.length > 0 
                  ? `${educationDetails[educationDetails.length - 1].level} - ${educationDetails[educationDetails.length - 1].school_name}`
                  : member.highest_educational_attainment || "—"}
              </span>
            </div>
            <div className="p-2">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Current Employment / Occupation</span>
              <span className="font-semibold text-black">
                {member.employment_status === "Employed" || member.employment_status === "Self-employed" || member.company || member.occupation ? 
                  [member.occupation || member.position, member.company].filter(Boolean).join(" at ") || member.employment_status || "—" 
                  : member.employment_status || "—"}
              </span>
            </div>
          </div>

          {/* SECTION III: SPIRITUAL RECORD */}
          <div className="bg-slate-100 text-slate-800 font-bold px-3 py-1.5 uppercase text-xs border-b border-slate-300 break-before-avoid tracking-wide">
            III. Spiritual Record
          </div>

          <div className="grid grid-cols-3 divide-x divide-slate-300 border-b border-slate-300 break-inside-avoid">
            <div className="p-2">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Date Saved</span>
              <span className="font-semibold text-black">
                {member.date_saved ? new Date(member.date_saved).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
              </span>
            </div>
            <div className="p-2">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Date Baptized</span>
              <span className="font-semibold text-black">
                {member.date_baptized || member.baptism_date ? new Date(member.date_baptized || member.baptism_date || "").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
              </span>
            </div>
            <div className="p-2">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Membership Date</span>
              <span className="font-semibold text-black">
                {member.membership_date ? new Date(member.membership_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : 
                 (member.created_at ? new Date(member.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—")}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 divide-x divide-slate-300 border-b border-slate-300 break-inside-avoid">
            <div className="p-2">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Baptized By</span>
              <span className="font-semibold text-black">{member.baptized_by || "—"}</span>
            </div>
            <div className="p-2">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Place of Baptism</span>
              <span className="font-semibold text-black">{member.place_of_baptism || "—"}</span>
            </div>
            <div className="p-2">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Witnessed By</span>
              <span className="font-semibold text-black">{member.witnessed_by || "—"}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-slate-300 border-b border-slate-300 break-inside-avoid">
            <div className="p-2">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Current Church</span>
              <span className="font-semibold text-black">{member.current_church || "CBT"} {member.years_in_church ? `(${member.years_in_church} yrs)` : ""}</span>
            </div>
            <div className="p-2">
              <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Previous Church</span>
              <span className="font-semibold text-black">
                {member.prev_church_name ? `${member.prev_church_name} ${member.prev_church_years ? `(${member.prev_church_years} yrs)` : ""}` : "—"}
              </span>
            </div>
          </div>

          {/* SECTION IV: MINISTRIES */}
          <div className="bg-slate-100 text-slate-800 font-bold px-3 py-1.5 uppercase text-xs border-b border-slate-300 break-before-avoid tracking-wide">
            IV. Active Ministries & Commitments
          </div>
          
          <div className="p-2 border-b border-slate-300 break-inside-avoid">
            <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Currently Enrolled Ministries ({ministriesList.length})</span>
            <span className="font-semibold text-black">{ministriesList.map(m => m.name).join(", ") || "None"}</span>
          </div>

          <div className="break-inside-avoid">
            <div className="p-2 border-b border-slate-300 bg-slate-50/50">
              <span className="block text-[10px] uppercase font-semibold text-slate-500">Annual Recommitments History</span>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300 font-semibold w-16">Year</th>
                  <th className="p-2 border-r border-slate-300 font-semibold">Ministries</th>
                  <th className="p-2 font-semibold">Offerings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {commitmentsHistory.length > 0 ? commitmentsHistory.map(c => (
                  <tr key={c.year}>
                    <td className="p-2 border-r border-slate-300 font-bold text-black">{c.year}</td>
                    <td className="p-2 border-r border-slate-300 font-semibold text-black text-sm">{c.ministries.join(", ") || "—"}</td>
                    <td className="p-2 font-semibold text-black text-sm">{c.offerings.join(", ") || "—"}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="p-2 italic font-semibold text-slate-400 text-center text-sm border-t-0">No commitment records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  )
}
