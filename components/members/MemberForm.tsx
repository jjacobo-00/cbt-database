"use client"

import React, { useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { toast } from "sonner"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createMember, updateMember } from "@/app/(dashboard)/members/actions"
import { Check, ChevronLeft, ChevronRight, ChevronDown, GraduationCap, Briefcase, UserX, Plus, Trash2, MapPin, Building, Home, Sparkles, Save, Loader2, User, User2, Heart, Church, ChevronsUpDown, X } from "lucide-react"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils/utils"
import Link from "next/link"
import { ALL_ADDRESS_PRESETS, OLONGAPO_BARANGAYS, AddressPreset } from "@/lib/constants/addresses"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
const memberSchema = z.object({
  // Step 1: Personal
  first_name: z.string().min(1, "First name is required"),
  middle_name: z.string().default(""),
  last_name: z.string().min(1, "Last name is required"),
  suffix: z.string().default(""),
  birth_date: z.string().min(1, "Date of birth is required"),
  birth_place: z.string().default(""),
  gender: z.string().min(1, "Gender is required"),
  contact_number: z.string().regex(/^09\d{9}$/, "Must be a valid 11-digit Philippine mobile number starting with 09"),
  email: z.string().email("Invalid email format").or(z.literal("")),
  marital_status: z.string().default("Single"),
  widowed_date: z.string().default(""),
  is_spouse_cbt_member: z.boolean().default(false),
  spouse_name: z.string().default(""),
  spouse_member_id: z.string().default(""),
  spouse_occupation: z.string().default(""),
  anniversary_date: z.string().default(""),
  
  // Spiritual info
  church_role: z.string().default("Member"),
  mission_id: z.string().default("main"),
  date_saved: z.string().default(""),
  membership_date: z.string().default(""),
  baptism_date: z.string().default(""),
  baptized_by: z.string().default(""),
  witness_by: z.string().default(""),
  place_of_baptism: z.string().default(""),

  // Step 2: Address
  house_number: z.string().default(""),
  unit_number: z.string().default(""),
  street: z.string().default(""),
  barangay: z.string().default(""),
  city: z.string().default(""),
  province: z.string().default(""),
  zip_code: z.string().default(""),
  country: z.string().default("Philippines"),

  is_perm_same_as_current: z.boolean().default(true),
  perm_house_number: z.string().default(""),
  perm_unit_number: z.string().default(""),
  perm_street: z.string().default(""),
  perm_barangay: z.string().default(""),
  perm_city: z.string().default(""),
  perm_province: z.string().default(""),
  perm_zip_code: z.string().default(""),
  perm_country: z.string().default("Philippines"),
  
  // Step 3: Medical & Health
  blood_type: z.string().default(""),
  allergies: z.string().default(""),
  medical_conditions: z.string().default(""),
  
  // Step 4: Status
  employment_status: z.enum(["Student", "Employed", "None"]),
  student_school: z.string().default(""),
  student_level: z.string().default("College"),
  student_year_level: z.string().default(""),
  student_course: z.string().default(""),
  company: z.string().default(""),
  position: z.string().default(""),
  
  // Step 4: Family
  father_name: z.string().default(""),
  father_is_member: z.boolean().default(false),
  father_member_id: z.string().default(""),
  father_occupation: z.string().default(""),
  father_contact_number: z.string().default(""),
  mother_name: z.string().default(""),
  mother_is_member: z.boolean().default(false),
  mother_member_id: z.string().default(""),
  mother_occupation: z.string().default(""),
  mother_contact_number: z.string().default(""),
  parents_civil_status: z.string().default(""),
  siblings: z.array(z.object({
    name: z.string().min(1, "Name is required"),
    birth_date: z.string().optional(),
    sibling_is_member: z.boolean().default(false),
    sibling_member_id: z.string().optional().nullable()
  })).default([]),
  children: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    birth_date: z.string().default(""),
    is_cbt_member: z.boolean().default(false),
    child_member_id: z.string().default(""),
  })).default([]),
  emergency_contact_name: z.string().default(""),
  emergency_contact_relationship: z.string().default(""),
  emergency_contact_number: z.string().default(""),
  emergency_contact_member_id: z.string().nullable().optional(),

  // Step 5: Education
  highest_educational_attainment: z.string().min(1, "Highest attainment required"),
  education_details: z.array(z.object({
    level: z.string().default(""),
    school_name: z.string().default(""),
    year_started: z.string().default(""),
    year_graduated: z.string().default(""),
    is_currently_enrolled: z.boolean().default(false),
  })).default([]),
  awards_honors: z.string().default(""),
  ministries: z.array(z.string()).default([]),
  offerings: z.array(z.string()).default([]),
}).superRefine((data, ctx) => {
  // Step 3 Validations
  if (data.employment_status === "Employed") {
    if (!data.company) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["company"], message: "Required" })
    if (!data.position) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["position"], message: "Required" })
  }
  
  // Step 5 Conditional validation — only the highest level school name is required
  const highestLevel = data.highest_educational_attainment
  data.education_details.forEach((edu, idx) => {
    const isHighestRow = edu.level === highestLevel
    if (isHighestRow) {
      if (!edu.school_name || edu.school_name.trim() === "") {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["education_details", idx, "school_name"], message: "School name is required for your highest attainment" })
      }
    }
  })
})

const STEPS = [
  { id: 1, title: "Personal" },
  { id: 2, title: "Address" },
  { id: 3, title: "Medical" },
  { id: 4, title: "Status" },
  { id: 5, title: "Family" },
  { id: 6, title: "Education" },
  { id: 7, title: "Commitment" },
  { id: 8, title: "Review" },
]

type Ministry = { id: string; name: string; for_everyone?: boolean; parent_id?: string | null }
type OfferingCategory = { id: string; name: string; is_monthly: boolean; month: number | null }
type BaseMember = { id: string; first_name: string; last_name: string; suffix?: string | null; contact_number?: string | null }
type MissionOption = { id: string; name: string; location?: string | null }

export function MemberForm({ 
  initialData, 
  ministries = [], 
  offeringCategories = [], 
  allMembers = [],
  missions = [],
  onSubmitOverride,
  hideBackButton = false,
  isInvite = false,
  hideSidePanel = false,
  externalStep,
  onExternalStepChange
}: { 
  initialData?: any; 
  ministries?: Ministry[]; 
  offeringCategories?: OfferingCategory[]; 
  allMembers?: BaseMember[];
  missions?: MissionOption[];
  onSubmitOverride?: (payload: string) => Promise<void>;
  hideBackButton?: boolean;
  isInvite?: boolean;
  hideSidePanel?: boolean;
  externalStep?: number;
  onExternalStepChange?: Dispatch<SetStateAction<number>>;
}) {
  const [internalStep, setInternalStep] = useState(1)
  const step = externalStep !== undefined ? externalStep : internalStep
  const setStep = onExternalStepChange ? onExternalStepChange : setInternalStep
  const showSidePanel = !hideSidePanel && !isInvite
  
  const form = useForm({
    resolver: zodResolver(memberSchema),
    mode: "onChange",
    defaultValues: {
      first_name: initialData?.first_name || "",
      middle_name: initialData?.middle_name || "",
      last_name: initialData?.last_name || "",
      suffix: initialData?.suffix || "",
      birth_date: initialData?.birth_date || "",
      birth_place: initialData?.birth_place || "",
      gender: initialData?.gender || "",
      contact_number: initialData?.contact_number || "",
      email: initialData?.email || "",
      
      // Current Address
      house_number: initialData?.house_number || "",
      unit_number: initialData?.unit_number || "",
      street: initialData?.street || "",
      barangay: initialData?.barangay || "",
      city: initialData?.city || "",
      province: initialData?.province || "",
      zip_code: initialData?.zip_code || "",
      country: initialData?.country || "Philippines",

      // Permanent Address
      is_perm_same_as_current: initialData?.is_perm_same_as_current ?? true,
      perm_house_number: initialData?.perm_house_number || "",
      perm_unit_number: initialData?.perm_unit_number || "",
      perm_street: initialData?.perm_street || "",
      perm_barangay: initialData?.perm_barangay || "",
      perm_city: initialData?.perm_city || "",
      perm_province: initialData?.perm_province || "",
      perm_zip_code: initialData?.perm_zip_code || "",
      perm_country: initialData?.perm_country || "Philippines",
      blood_type: initialData?.blood_type || "",
      allergies: initialData?.allergies || "",
      medical_conditions: initialData?.medical_conditions || "",
      employment_status: (initialData?.employment_status as any) || "None",
      student_school: initialData?.student_school || "",
      student_level: initialData?.student_level || "College",
      student_year_level: initialData?.student_year_level || "",
      student_course: initialData?.student_course || "",
      company: initialData?.company || "",
      position: initialData?.position || "",
      father_name: initialData?.father_name || "",
      father_is_member: !!initialData?.father_member_id,
      father_member_id: initialData?.father_member_id || "",
      father_occupation: initialData?.father_occupation || "",
      father_contact_number: initialData?.father_contact_number || "",
      mother_name: initialData?.mother_name || "",
      mother_is_member: !!initialData?.mother_member_id,
      mother_member_id: initialData?.mother_member_id || "",
      mother_occupation: initialData?.mother_occupation || "",
      mother_contact_number: initialData?.mother_contact_number || "",
      parents_civil_status: initialData?.parents_civil_status || "",
      siblings: initialData?.siblings?.length ? initialData.siblings.map((s: any) => ({
        name: s.name || "",
        birth_date: s.birth_date || s.age || "",
        sibling_is_member: !!s.sibling_member_id,
        sibling_member_id: s.sibling_member_id || ""
      })) : [{ name: "", birth_date: "", sibling_is_member: false, sibling_member_id: "" }],
      children: initialData?.children?.length ? initialData.children.map((c: any) => ({
        id: c.id,
        name: c.name,
        birth_date: c.birth_date || "",
        is_cbt_member: !!c.child_member_id,
        child_member_id: c.child_member_id || ""
      })) : [],
      emergency_contact_name: initialData?.emergency_contact_name || "",
      emergency_contact_relationship: initialData?.emergency_contact_relationship || "",
      emergency_contact_number: initialData?.emergency_contact_number || "",
      highest_educational_attainment: initialData?.highest_educational_attainment || "",
      education_details: initialData?.education_details || [{ level: "Elementary", school_name: "", year_started: "", year_graduated: "", is_currently_enrolled: false }],
      awards_honors: initialData?.awards_honors || "",
      ministries: initialData?.ministries || [],
      marital_status: initialData?.marital_status || "Single",
      widowed_date: initialData?.widowed_date || "",
      is_spouse_cbt_member: !!initialData?.spouse_member_id,
      spouse_name: initialData?.spouse_name || "",
      spouse_member_id: initialData?.spouse_member_id || "",
      spouse_occupation: initialData?.spouse_occupation || "",
      anniversary_date: initialData?.anniversary_date || "",
      church_role: initialData?.church_role || "Member",
      mission_id: initialData?.mission_id || "main",
      date_saved: initialData?.date_saved || "",
      membership_date: initialData?.membership_date || new Date().toISOString().split("T")[0],
      baptism_date: initialData?.baptism_date || "",
      baptized_by: initialData?.baptized_by || "",
      witness_by: initialData?.witness_by || "",
      place_of_baptism: initialData?.place_of_baptism || "",
    }
  })

  const [restoredDraftInfo, setRestoredDraftInfo] = React.useState<string | null>(null)
  const DRAFT_MAX_AGE_MS = 30 * 60 * 1000 // 30 minutes

  const hasMeaningfulContent = (val: any) => {
    if (!val) return false
    return Boolean(
      val.first_name?.trim() ||
      val.last_name?.trim() ||
      val.contact_number?.trim() ||
      val.email?.trim() ||
      val.street?.trim() ||
      val.father_name?.trim() ||
      val.mother_name?.trim() ||
      val.student_school?.trim() ||
      (val.ministries && val.ministries.length > 0)
    )
  }

  // Draft Recovery Check (On Mount) - DISABLED for shareable invite links & member edits
  React.useEffect(() => {
    if (!initialData && !isInvite) {
      const savedDraft = localStorage.getItem("cbt_new_member_draft")
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft)
          const draftValues = parsed.values || parsed
          const timestamp = parsed.timestamp || 0

          const isExpired = timestamp > 0 && (Date.now() - timestamp > DRAFT_MAX_AGE_MS)
          const isValidContent = hasMeaningfulContent(draftValues)

          if (!isExpired && isValidContent) {
            form.reset(draftValues)
            const draftName = [draftValues.first_name, draftValues.last_name].filter(Boolean).join(" ")
            setRestoredDraftInfo(draftName || "Unsaved Entry")
            setTimeout(() => toast.info("Unsaved draft restored automatically.", { icon: "📝" }), 500)
          } else {
            // Silently purge expired or empty draft
            localStorage.removeItem("cbt_new_member_draft")
          }
        } catch (e) {
          console.error("Failed to parse draft", e)
          localStorage.removeItem("cbt_new_member_draft")
        }
      }
    } else {
      // Clean up any stale draft when on a shareable link or editing an existing member
      localStorage.removeItem("cbt_new_member_draft")
    }
  }, [initialData, isInvite])

  // Auto-Save Draft (Only for normal admin add member; DISABLED for shareable links & edits)
  React.useEffect(() => {
    if (!initialData && !isInvite) {
      const subscription = form.watch((value) => {
        if (hasMeaningfulContent(value)) {
          const payload = {
            timestamp: Date.now(),
            values: value
          }
          localStorage.setItem("cbt_new_member_draft", JSON.stringify(payload))
        } else {
          localStorage.removeItem("cbt_new_member_draft")
        }
      })
      return () => subscription.unsubscribe()
    }
  }, [initialData, isInvite, form.watch])

  const handleDiscardDraft = () => {
    localStorage.removeItem("cbt_new_member_draft")
    setRestoredDraftInfo(null)
    form.reset({
      first_name: "",
      middle_name: "",
      last_name: "",
      suffix: "",
      birth_date: "",
      birth_place: "",
      contact_number: "",
      email: "",
      marital_status: "Single",
      widowed_date: "",
      spouse_name: "",
      spouse_occupation: "",
      anniversary_date: "",
      house_number: "",
      unit_number: "",
      street: "",
      barangay: "",
      city: "",
      province: "",
      zip_code: "",
      country: "Philippines",
      is_perm_same_as_current: true,
      perm_house_number: "",
      perm_unit_number: "",
      perm_street: "",
      perm_barangay: "",
      perm_city: "",
      perm_province: "",
      perm_zip_code: "",
      perm_country: "Philippines",
      blood_type: "Unknown",
      allergies: "",
      medical_conditions: "",
      employment_status: "Employed",
      student_school: "",
      student_level: "",
      student_year_level: "",
      student_course: "",
      company: "",
      position: "",
      father_name: "",
      father_occupation: "",
      father_contact_number: "",
      mother_name: "",
      mother_occupation: "",
      mother_contact_number: "",
      parents_civil_status: "Married",
      emergency_contact_name: "",
      emergency_contact_relationship: "",
      emergency_contact_number: "",
      highest_educational_attainment: "High School",
      education_details: [],
      siblings: [],
      children: [],
      ministries: [],
      church_role: "Member",
      date_saved: "",
      membership_date: new Date().toISOString().split("T")[0],
      baptism_date: "",
      baptized_by: "",
      witness_by: "",
      place_of_baptism: "",
    })
    toast.info("Draft discarded. Form reset to blank.")
  }

  const { fields: siblingFields, append: appendSibling, remove: removeSibling } = useFieldArray({ control: form.control, name: "siblings" })
  const { fields: childFields, append: appendChild, remove: removeChild } = useFieldArray({ control: form.control, name: "children" })
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control: form.control, name: "education_details" })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEmergencyMember, setIsEmergencyMember] = useState(() => !!initialData?.emergency_contact_member_id)
  const [emergencyComboboxOpen, setEmergencyComboboxOpen] = useState(false)

  const isErrorScrollingRef = React.useRef(false)

  const scrollToErrorField = (fieldName?: string) => {
    isErrorScrollingRef.current = true
    setTimeout(() => {
      let targetEl: HTMLElement | null = null

      if (fieldName) {
        targetEl = document.querySelector<HTMLElement>(`[name="${fieldName}"], [id="${fieldName}"], [data-field="${fieldName}"]`)
      }

      if (!targetEl) {
        targetEl = document.querySelector<HTMLElement>('[aria-invalid="true"], .text-destructive, p.text-destructive')
      }

      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" })
        const input = targetEl.tagName === "INPUT" || targetEl.tagName === "SELECT" || targetEl.tagName === "TEXTAREA" 
          ? targetEl 
          : targetEl.parentElement?.querySelector<HTMLElement>('input, select, textarea') || targetEl
        input?.focus?.()
      }
    }, 180)
  }

  const onInvalid = (errors: any) => {
    const firstKey = Object.keys(errors)[0]
    const firstError = errors[firstKey]
    const message = firstError?.message || firstError?.root?.message || firstError?.[0]?.school_name?.message || "Please fix the errors before saving."
    toast.error(`Validation error: ${message}`)
    console.error("Form validation errors:", errors)

    let targetStep = step
    if (["first_name", "last_name", "birth_date", "gender", "contact_number", "email"].includes(firstKey)) targetStep = 1;
    else if (firstKey.includes("street") || firstKey.includes("city") || firstKey.includes("province") || firstKey.includes("zip") || firstKey.includes("barangay") || firstKey.includes("house") || firstKey.includes("unit")) targetStep = 2;
    else if (["blood_type", "allergies", "medical_conditions"].includes(firstKey)) targetStep = 3;
    else if (["employment_status", "student_school", "student_year_level", "student_course", "company", "position"].includes(firstKey)) targetStep = 4;
    else if (["father_name", "father_occupation", "father_contact_number", "mother_name", "mother_occupation", "mother_contact_number", "parents_civil_status", "siblings", "children", "emergency_contact_name", "emergency_contact_relationship", "emergency_contact_number", "marital_status", "widowed_date", "spouse_name", "spouse_occupation", "anniversary_date"].includes(firstKey)) targetStep = 5;
    else if (["highest_educational_attainment", "education_details"].includes(firstKey)) targetStep = 6;
    else if (["ministries", "date_saved", "membership_date", "baptism_date"].includes(firstKey)) targetStep = 7;

    if (targetStep !== step) {
      setStep(targetStep)
    }

    scrollToErrorField(firstKey)
  }

  const onSubmit = async (values: z.infer<typeof memberSchema>) => {
    setIsSubmitting(true)
    try {
      // Filter out any blank appended sibling items before submitting
      if (values.siblings && Array.isArray(values.siblings)) {
        values.siblings = values.siblings.filter(s => s.name && s.name.trim() !== "")
      }

      const missionIdVal = values.mission_id === "main" ? null : (values.mission_id || null)
      const payload = JSON.stringify({ id: initialData?.id, ...values, mission_id: missionIdVal })
      
      if (onSubmitOverride) {
        await onSubmitOverride(payload)
        localStorage.removeItem("cbt_new_member_draft")
      } else {
        if (initialData) {
          await updateMember(payload)
        } else {
          await createMember(payload)
        }
        localStorage.removeItem("cbt_new_member_draft")
      }
    } catch (e: any) {
      if (isRedirectError(e)) {
        localStorage.removeItem("cbt_new_member_draft")
        if (!initialData) {
          toast.success("New member record created successfully!")
        } else {
          toast.success("Member profile updated successfully!")
        }
        throw e
      }
      console.error(e)
      toast.error("An error occurred while saving member profile.")
      setIsSubmitting(false)
    }
  }

  const employmentStatus = form.watch("employment_status")
  const highestAttainment = form.watch("highest_educational_attainment")
  const isPermSame = form.watch("is_perm_same_as_current")

  React.useEffect(() => {
    const levelsMap: Record<string, string[]> = {
      "None": [],
      "Elementary": ["Elementary"],
      "High School": ["Elementary", "High School"],
      "Senior High School": ["Elementary", "High School", "Senior High School"],
      "Vocational": ["Elementary", "High School", "Senior High School", "Vocational"],
      "College": ["Elementary", "High School", "Senior High School", "College"],
      "Postgraduate": ["Elementary", "High School", "Senior High School", "College", "Postgraduate"],
    }
    const requiredLevels = levelsMap[highestAttainment] || []
    const currentFields = form.getValues("education_details") || []
    
    let changed = false
    const newFields = requiredLevels.map(level => {
      const existing = currentFields.find(f => f.level === level)
      if (existing) {
        if (level !== highestAttainment && existing.is_currently_enrolled) {
          changed = true
          return { ...existing, is_currently_enrolled: false }
        }
        return existing
      }
      changed = true
      return { level, school_name: "", year_started: "", year_graduated: "", is_currently_enrolled: false }
    })
    
    if (changed || newFields.length !== currentFields.length) {
      form.setValue("education_details", newFields as any, { shouldValidate: step === 6 })
    }
  }, [highestAttainment, form, step])

  const studentSchool = form.watch("student_school")
  const studentLevel = form.watch("student_level")
  const studentYearLevel = form.watch("student_year_level")
  const studentCourse = form.watch("student_course")

  // Auto-detect student education level from year level / course text
  React.useEffect(() => {
    if (employmentStatus !== "Student") return
    const text = `${studentYearLevel} ${studentCourse}`.toLowerCase()
    if (!text.trim()) return

    if (/grade\s*(11|12)|shs|senior\s*high|stem|humss|abm|gas|tvl/.test(text)) {
      if (studentLevel !== "Senior High School") form.setValue("student_level", "Senior High School")
    } else if (/grade\s*([7-9]|10)|jhs|junior\s*high|high\s*school/.test(text)) {
      if (studentLevel !== "High School") form.setValue("student_level", "High School")
    } else if (/grade\s*[1-6]|elem|elementary/.test(text)) {
      if (studentLevel !== "Elementary") form.setValue("student_level", "Elementary")
    } else if (/bs|ab|bachelor|college|university|tertiary|1st\s*year|2nd\s*year|3rd\s*year|4th\s*year|5th\s*year/.test(text)) {
      if (studentLevel !== "College") form.setValue("student_level", "College")
    } else if (/master|doctor|postgrad|phd|ms|ma/.test(text)) {
      if (studentLevel !== "Postgraduate") form.setValue("student_level", "Postgraduate")
    }
  }, [studentYearLevel, studentCourse, employmentStatus, studentLevel, form])

  // Auto-sync Student Status (Step 4) -> Education Details (Step 6)
  React.useEffect(() => {
    if (employmentStatus !== "Student" || (step !== 4 && step !== 6)) return
    const currentTargetLevel = studentLevel || "College"

    // 1. Sync highest_educational_attainment if needed
    if (highestAttainment !== currentTargetLevel) {
      form.setValue("highest_educational_attainment", currentTargetLevel, { shouldValidate: step === 6 })
    }

    // 2. Sync school_name & currently_enrolled flag into education_details
    const currentFields = form.getValues("education_details") || []
    if (currentFields.length > 0) {
      let updated = false
      const nextFields = currentFields.map(field => {
        if (field.level === currentTargetLevel) {
          const newSchool = studentSchool !== undefined ? studentSchool : field.school_name
          if (field.school_name !== newSchool || !field.is_currently_enrolled) {
            updated = true
            return {
              ...field,
              school_name: newSchool,
              is_currently_enrolled: true,
              year_graduated: ""
            }
          }
        }
        return field
      })

      if (updated) {
        form.setValue("education_details", nextFields as any, { shouldValidate: step === 6 })
      }
    }
  }, [employmentStatus, studentSchool, studentLevel, highestAttainment, form, step])

  // Reverse sync: Step 6 -> Step 4 student_school if currently enrolled
  // Only sync from Step 6 to Step 4 when actively on Step 6 to prevent feedback loop while typing on Step 4
  React.useEffect(() => {
    if (step !== 6 || employmentStatus !== "Student") return
    const currentFields = form.getValues("education_details")
    if (!currentFields || !Array.isArray(currentFields)) return
    const enrolledCard = currentFields.find(f => f.is_currently_enrolled)
    if (enrolledCard && enrolledCard.school_name !== undefined && enrolledCard.school_name !== studentSchool) {
      form.setValue("student_school", enrolledCard.school_name)
    }
  }, [step, employmentStatus, studentSchool, form])

  React.useEffect(() => {
    if (!ministries || ministries.length === 0) return
    const mandatoryIds = ministries
      .filter(m => m.for_everyone || m.name.toLowerCase().includes("evangelistic"))
      .map(m => m.id)

    if (mandatoryIds.length > 0) {
      const current = form.getValues("ministries") || []
      const missing = mandatoryIds.filter(id => !current.includes(id))
      if (missing.length > 0) {
        form.setValue("ministries", [...current, ...missing])
      }
    }
  }, [ministries, form])

  const formRef = React.useRef<HTMLFormElement>(null)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!formRef.current) return
      // If user is already focused on an element inside this form (e.g. typing), don't forcibly move focus
      if (formRef.current.contains(document.activeElement)) return

      const firstInput = formRef.current.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled])"
      )
      if (firstInput) {
        firstInput.focus()
      } else {
        const nextBtn = formRef.current.querySelector<HTMLButtonElement>("button[data-next-btn]")
        if (nextBtn) nextBtn.focus()
      }
    }, 120)

    return () => clearTimeout(timer)
  }, [step])

  const handleStepClick = async (targetStepId: number) => {
    if (targetStepId === step) return
    
    // If target step is backward, allow immediately
    if (targetStepId < step) {
      setStep(targetStepId)
      return
    }

    // If target step is forward
    // If we are editing, allow clicking any step immediately
    if (initialData) {
      setStep(targetStepId)
      return
    }

    // If we are creating, validate current step first before going forward
    if (step === 5) {
      const currentSiblings = form.getValues("siblings") || []
      const validSiblings = currentSiblings.filter(s => s.name && s.name.trim() !== "")
      form.setValue("siblings", validSiblings)
    }

    let fieldsToValidate: any[] = []
    if (step === 1) fieldsToValidate = ["first_name", "last_name", "birth_date", "gender", "contact_number", "email"]
    if (step === 2) fieldsToValidate = []
    if (step === 3) fieldsToValidate = ["blood_type", "allergies", "medical_conditions"]
    if (step === 4) fieldsToValidate = ["employment_status", "student_school", "student_year_level", "student_course", "company", "position"]
    if (step === 5) fieldsToValidate = ["father_name", "father_occupation", "father_contact_number", "mother_name", "mother_occupation", "mother_contact_number", "parents_civil_status", "siblings", "emergency_contact_name", "emergency_contact_relationship", "emergency_contact_number"]
    if (step === 6) fieldsToValidate = ["highest_educational_attainment", "education_details"]

    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate as any)
      if (isValid) {
        // Only allow jumping up to step + 1 to prevent skipping steps in create mode
        setStep(Math.min(step + 1, targetStepId))
      } else {
        toast.error("Please fill in all required fields correctly.")
        const formErrors = form.formState.errors
        const firstErrKey = Object.keys(formErrors)[0]
        scrollToErrorField(firstErrKey)
      }
    } else {
      setStep(Math.min(step + 1, targetStepId))
    }
  }

  const validateStep = async () => {
    if (step === 5) {
      const currentSiblings = form.getValues("siblings") || []
      const validSiblings = currentSiblings.filter(s => s.name && s.name.trim() !== "")
      form.setValue("siblings", validSiblings)
    }

    let fieldsToValidate: any[] = []
    if (step === 1) fieldsToValidate = ["first_name", "last_name", "birth_date", "gender", "contact_number", "email"]
    if (step === 2) fieldsToValidate = [] // Address step
    if (step === 3) fieldsToValidate = ["blood_type", "allergies", "medical_conditions"]
    if (step === 4) fieldsToValidate = ["employment_status", "student_school", "student_year_level", "student_course", "company", "position"]
    if (step === 5) fieldsToValidate = ["father_name", "father_occupation", "father_contact_number", "mother_name", "mother_occupation", "mother_contact_number", "parents_civil_status", "siblings", "emergency_contact_name", "emergency_contact_relationship", "emergency_contact_number"]
    if (step === 6) fieldsToValidate = ["highest_educational_attainment", "education_details"]
    
    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate as any)
      if (isValid) {
        setStep(s => Math.min(STEPS.length, s + 1))
      } else {
        toast.error("Please fill in all required fields correctly.")
        const formErrors = form.formState.errors
        const firstErrKey = Object.keys(formErrors)[0]
        scrollToErrorField(firstErrKey)
      }
    } else {
      setStep(s => Math.min(STEPS.length, s + 1))
    }
  }

  React.useEffect(() => {
    if (isErrorScrollingRef.current) {
      isErrorScrollingRef.current = false
      return
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [step])

  // Sync education details when highest attainment changes
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "highest_educational_attainment") {
        const highest = value.highest_educational_attainment
        const eduDetails = form.getValues("education_details") || []
        const updated = eduDetails.map(item => ({
          ...item,
          is_currently_enrolled: item.level === highest ? item.is_currently_enrolled : false
        }))
        form.setValue("education_details", updated)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  const R = () => <span className="text-destructive ml-1">*</span>

  const renderMemberSelect = (
    label: string, 
    idField: string, 
    nameField: string, 
    isMemberField: string, 
    excludeId?: string,
    occupationField?: string,
    contactField?: string,
    filterGender?: "Male" | "Female"
  ) => {
    const isMember = form.watch(isMemberField as any)
    const currentId = form.watch(idField as any)
    
    return (
      <div className="grid gap-4 mt-2 p-4 border rounded-lg bg-muted/20">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`member_check_${idField}`}
            checked={isMember}
            onChange={(e) => {
              form.setValue(isMemberField as any, e.target.checked, { shouldValidate: true })
              if (!e.target.checked) {
                form.setValue(idField as any, "", { shouldValidate: true })
              }
            }}
            className="h-4 w-4 rounded border-input bg-transparent text-primary focus:ring-primary cursor-pointer accent-primary"
          />
          <label htmlFor={`member_check_${idField}`} className="text-sm text-foreground font-medium cursor-pointer flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Is CBT member?
          </label>
        </div>

        {isMember ? (
          <div className="grid gap-2 max-w-sm">
            <Label className="text-[13px] text-muted-foreground">{label}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "justify-between bg-transparent h-12 w-full font-normal",
                    !currentId && "text-muted-foreground"
                  )}
                >
                  {currentId
                    ? (() => {
                        const m = allMembers.find((member) => member.id === currentId)
                        return m ? `${m.first_name} ${m.last_name}` : "Select a member..."
                      })()
                    : "Select a member..."}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] md:w-[384px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search member..." className="h-11" />
                  <CommandList>
                    <CommandEmpty className="py-6 text-center text-sm px-4">
                      <span className="block font-medium mb-1">Profile not found.</span>
                      <span className="text-muted-foreground text-xs">Uncheck "Is CBT member?" to enter their name manually for now.</span>
                    </CommandEmpty>
                    <CommandGroup>
                      {allMembers
                        .filter(m => m.id !== excludeId)
                        .filter(m => !filterGender || (m as any).gender === filterGender || (m as any).sex === filterGender)
                        .map((m: any) => (
                        <CommandItem
                          key={m.id}
                          value={`${m.first_name} ${m.last_name}`}
                          onSelect={() => {
                            form.setValue(idField as any, m.id, { shouldValidate: true })
                            form.setValue(nameField as any, `${m.first_name} ${m.last_name}`, { shouldValidate: true })
                            if (occupationField) {
                              const occ = m.position || m.company || ""
                              if (occ) form.setValue(occupationField as any, occ, { shouldValidate: true })
                            }
                            if (contactField) {
                              if (m.contact_number) form.setValue(contactField as any, m.contact_number, { shouldValidate: true })
                            }
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 text-primary",
                              currentId === m.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {m.first_name} {m.last_name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        ) : null}
      </div>
    )
  }

  const applyAddressPreset = (preset: AddressPreset, target: "current" | "permanent") => {
    if (target === "current") {
      form.setValue("barangay", preset.barangay, { shouldValidate: true })
      form.setValue("city", preset.city, { shouldValidate: true })
      form.setValue("province", preset.province, { shouldValidate: true })
      form.setValue("zip_code", preset.zip_code, { shouldValidate: true })
      if (form.getValues("is_perm_same_as_current")) {
        form.setValue("perm_barangay", preset.barangay, { shouldValidate: true })
        form.setValue("perm_city", preset.city, { shouldValidate: true })
        form.setValue("perm_province", preset.province, { shouldValidate: true })
        form.setValue("perm_zip_code", preset.zip_code, { shouldValidate: true })
      }
    } else {
      form.setValue("perm_barangay", preset.barangay, { shouldValidate: true })
      form.setValue("perm_city", preset.city, { shouldValidate: true })
      form.setValue("perm_province", preset.province, { shouldValidate: true })
      form.setValue("perm_zip_code", preset.zip_code, { shouldValidate: true })
    }
  }

  const handleBarangayAutoSelect = (currentVal: string, target: "current" | "permanent") => {
    if (!currentVal || currentVal.trim() === "") return
    const trimmed = currentVal.trim().toLowerCase()
    
    const match = 
      ALL_ADDRESS_PRESETS.find(p => p.barangay.toLowerCase().startsWith(trimmed)) ||
      ALL_ADDRESS_PRESETS.find(p => p.barangay.toLowerCase().includes(trimmed))
      
    if (match) {
      applyAddressPreset(match, target)
    }
  }

  return (
    <div className="sm:bg-card rounded-xl sm:border sm:shadow-sm p-3.5 sm:p-6 md:p-10 w-full mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {!hideBackButton && (
            <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-muted/80">
              <Link href={initialData ? `/members/${initialData.id}` : "/members"}>
                <ChevronLeft className="h-6 w-6" />
              </Link>
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{initialData ? "Edit Member Profile" : "New Member Form"}</h2>
            {initialData && (
              <p className="text-xs text-muted-foreground">
                Editing record for {initialData.first_name} {initialData.last_name}
              </p>
            )}
          </div>
        </div>

        {initialData && (
          <Button 
            type="button"
            onClick={() => form.handleSubmit(onSubmit, onInvalid)()}
            disabled={isSubmitting}
            className="h-11 px-6 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Save Changes</span>
          </Button>
        )}
      </div>

      {/* Mobile Stepper Header (md:hidden) */}
      <div className="md:hidden sticky top-0 bg-background/95 backdrop-blur-md z-10 py-3 border-b mb-6 space-y-2.5 px-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              Step {step}/{STEPS.length}
            </span>
            <span className="text-xs font-semibold text-foreground truncate max-w-[190px]">
              {STEPS[step - 1]?.title}
            </span>
          </div>
          <span className="text-[11px] font-bold text-muted-foreground">
            {Math.round((step / STEPS.length) * 100)}%
          </span>
        </div>

        {/* Animated Progress Bar */}
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${(step / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Single-Row Horizontal Scrollable Step Dots */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 touch-contain">
          {STEPS.map((s) => {
            const isActive = step === s.id
            const isCompleted = step > s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleStepClick(s.id)}
                disabled={!initialData && s.id > step + 1}
                className={cn(
                  "h-7 px-2.5 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center gap-1 border",
                  isActive ? "bg-primary text-primary-foreground border-primary shadow-xs" :
                  isCompleted ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" :
                  "bg-muted/50 text-muted-foreground border-transparent"
                )}
              >
                {isCompleted ? <Check className="h-3 w-3" /> : <span>{s.id}</span>}
                <span className="text-[10px]">{s.title}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Desktop Stepper Header (hidden md:flex) */}
      <div className="hidden md:flex sticky top-0 bg-card z-10 py-4 border-b border-border mb-8 items-center justify-between gap-1 sm:gap-2 lg:gap-3 px-1 overflow-x-auto no-scrollbar">
        {STEPS.map((s) => {
          const isActive = step === s.id
          const isCompleted = step > s.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleStepClick(s.id)}
              disabled={!initialData && s.id > step + 1}
              className={cn(
                "flex items-center gap-1.5 group transition-all duration-200 outline-none text-left rounded-lg p-1 shrink-0 xl:shrink",
                (initialData || s.id <= step + 1) ? "cursor-pointer" : "cursor-not-allowed opacity-50"
              )}
            >
              <div className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all group-hover:scale-105 duration-200 shrink-0",
                isActive ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" : 
                isCompleted ? "bg-primary/80 text-primary-foreground group-hover:bg-primary" : 
                "bg-muted-foreground/20 text-muted-foreground group-hover:bg-muted-foreground/30"
              )}>
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : s.id}
              </div>
              <span className={cn(
                "text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap",
                isActive ? "text-primary font-bold" : 
                isCompleted ? "text-foreground group-hover:text-primary" : 
                "text-muted-foreground group-hover:text-foreground"
              )}>
                {s.title}
              </span>
            </button>
          )
        })}
      </div>

      <form 
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit, onInvalid)} 
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const target = e.target as HTMLElement
            if (target.tagName === "TEXTAREA" || target.tagName === "BUTTON") return

            e.preventDefault()
            if (step < STEPS.length) {
              validateStep()
            }
          }
        }}
        className="space-y-6 pb-28 sm:pb-6"
      >
        {/* DRAFT RESTORED BANNER */}
        {restoredDraftInfo && (
          <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">
                📝
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">Unsaved Draft Restored</h4>
                <p className="text-xs text-muted-foreground">
                  Restored your recent unsaved progress ({restoredDraftInfo}). You can continue editing or clear it anytime.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDiscardDraft}
                className="text-xs border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20"
              >
                Discard & Clear Form
              </Button>
            </div>
          </div>
        )}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
          <div className={cn("space-y-6 pb-28 sm:pb-6", showSidePanel ? "lg:col-span-8" : "lg:col-span-12")}>
            {/* STEP 1: PERSONAL INFORMATION */}
            {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-8">
            <h3 className="text-xl font-semibold mb-4 border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="grid gap-2">
                <Label className="text-[13px] text-muted-foreground">First Name<R/></Label>
                <Input {...form.register("first_name")} className="h-12 bg-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0" />
                {form.formState.errors.first_name && <p className="text-sm text-destructive">{form.formState.errors.first_name.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] text-muted-foreground">Middle Name</Label>
                <Input {...form.register("middle_name")} className="h-12 bg-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0" placeholder="Optional" />
                {form.formState.errors.middle_name && <p className="text-sm text-destructive">{form.formState.errors.middle_name.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] text-muted-foreground">Last Name<R/></Label>
                <Input {...form.register("last_name")} className="h-12 bg-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0" />
                {form.formState.errors.last_name && <p className="text-sm text-destructive">{form.formState.errors.last_name.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] text-muted-foreground">Suffix</Label>
                <div className="relative flex items-center">
                  <select 
                    {...form.register("suffix")} 
                    className={cn(
                      "flex appearance-none h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0",
                      !form.watch("suffix") ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    <option value="" className="bg-card text-muted-foreground">None</option>
                    <option value="Jr." className="bg-card text-foreground">Jr.</option>
                    <option value="Sr." className="bg-card text-foreground">Sr.</option>
                    <option value="I" className="bg-card text-foreground">I</option>
                    <option value="II" className="bg-card text-foreground">II</option>
                    <option value="III" className="bg-card text-foreground">III</option>
                    <option value="IV" className="bg-card text-foreground">IV</option>
                    <option value="V" className="bg-card text-foreground">V</option>
                    <option value="Rev." className="bg-card text-foreground">Rev.</option>
                    <option value="Ph.D." className="bg-card text-foreground">Ph.D.</option>
                    <option value="MD" className="bg-card text-foreground">MD</option>
                  </select>
                  <ChevronDown className="absolute right-3 h-4 w-4 text-muted-foreground opacity-50 pointer-events-none" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] text-muted-foreground">Date of Birth<R/></Label>
                <div className="relative flex items-center">
                  <DatePicker
                    value={form.watch("birth_date")}
                    onChange={(v) => form.setValue("birth_date", v, { shouldValidate: true, shouldDirty: true })}
                    placeholder="Select date of birth"
                    className="h-12 w-full"
                  />
                </div>
                {form.formState.errors.birth_date && <p className="text-sm text-destructive">{form.formState.errors.birth_date.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] text-muted-foreground">Place of Birth</Label>
                <Input {...form.register("birth_place")} className="h-12 bg-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0" placeholder="e.g. Olongapo City" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] text-muted-foreground">Gender<R/></Label>
                <div className="relative flex items-center">
                  <select 
                    {...form.register("gender")} 
                    className={cn(
                      "flex appearance-none h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0",
                      !form.watch("gender") ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    <option value="" className="bg-card text-muted-foreground">Select...</option>
                    <option value="Male" className="bg-card text-foreground">Male</option>
                    <option value="Female" className="bg-card text-foreground">Female</option>
                  </select>
                  <ChevronDown className="absolute right-3 h-4 w-4 text-muted-foreground opacity-50 pointer-events-none" />
                </div>
                {form.formState.errors.gender && <p className="text-sm text-destructive">{form.formState.errors.gender.message}</p>}
              </div>

              <div className="grid gap-2 md:col-span-1">
                <Label className="text-[13px] text-muted-foreground">Contact Number<R/></Label>
                <Input {...form.register("contact_number")} className="h-12 bg-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0" placeholder="09XX XXX XXXX" />
                {form.formState.errors.contact_number && <p className="text-sm text-destructive">{form.formState.errors.contact_number.message}</p>}
              </div>
              <div className="grid gap-2 md:col-span-1">
                <Label className="text-[13px] text-muted-foreground">Email Address</Label>
                <Input {...form.register("email")} type="email" className="h-12 bg-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0" placeholder="Optional" />
                {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
              </div>

              {/* Marital Status & Spouse Info */}
              <div className="col-span-1 md:col-span-2 mt-2 mb-2">
                <h4 className="font-semibold text-lg border-b pb-2">Marital & Family Background</h4>
              </div>

              <div className="grid gap-2 md:col-span-1">
                <Label className="text-[13px] text-muted-foreground">Marital Status</Label>
                <div className="relative flex items-center">
                  <select 
                    {...form.register("marital_status")} 
                    className={cn(
                      "flex appearance-none h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0",
                      !form.watch("marital_status") ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    <option value="Single" className="bg-card text-foreground">Single</option>
                    <option value="Married" className="bg-card text-foreground">Married</option>
                    <option value="Widowed" className="bg-card text-foreground">Widowed</option>
                  </select>
                  <ChevronDown className="absolute right-3 h-4 w-4 text-muted-foreground opacity-50 pointer-events-none" />
                </div>
              </div>

              {form.watch("marital_status") === "Widowed" && (
                <div className="grid gap-2 md:col-span-1 p-4 border rounded-lg bg-muted/20">
                  <Label className="text-[13px] text-muted-foreground">Date Widowed</Label>
                  <DatePicker
                    value={form.watch("widowed_date")}
                    onChange={(v) => form.setValue("widowed_date", v, { shouldValidate: true, shouldDirty: true })}
                    placeholder="Select date"
                    className="h-12 w-full"
                  />
                </div>
              )}

              {form.watch("marital_status") === "Married" && (
                <>
                  <div className="grid gap-2 md:col-span-1">
                    <Label className="text-[13px] text-muted-foreground">Wedding Date / Anniversary</Label>
                    <DatePicker
                      value={form.watch("anniversary_date")}
                      onChange={(v) => form.setValue("anniversary_date", v, { shouldValidate: true, shouldDirty: true })}
                      placeholder="Select date"
                      className="h-12 w-full"
                    />
                  </div>
                  
                  <div className="grid gap-4 md:col-span-2 p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isSpouseCbtMember"
                        checked={form.watch("is_spouse_cbt_member")}
                        onChange={(e) => {
                          form.setValue("is_spouse_cbt_member", e.target.checked, { shouldValidate: true })
                          if (!e.target.checked) {
                            form.setValue("spouse_member_id", "", { shouldValidate: true })
                          }
                        }}
                        className="h-4 w-4 rounded border-input bg-transparent text-primary focus:ring-primary cursor-pointer accent-primary"
                      />
                      <label htmlFor="isSpouseCbtMember" className="text-sm text-foreground font-medium cursor-pointer flex items-center gap-2">
                        <Heart className="h-4 w-4 text-rose-500" />
                        Is CBT member?
                      </label>
                    </div>

                    {form.watch("is_spouse_cbt_member") ? (
                      <div className="grid gap-2 max-w-sm">
                        <Label className="text-[13px] text-muted-foreground">Select Spouse (Member)</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "justify-between bg-transparent h-12 w-full font-normal",
                                !form.watch("spouse_member_id") && "text-muted-foreground"
                              )}
                            >
                              {form.watch("spouse_member_id")
                                ? (() => {
                                    const m = allMembers.find((member) => member.id === form.watch("spouse_member_id"))
                                    return m ? `${m.first_name} ${m.last_name}` : "Select a member..."
                                  })()
                                : "Select a member..."}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] md:w-[384px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search member..." className="h-11" />
                              <CommandList>
                                <CommandEmpty className="py-6 text-center text-sm px-4">
                                  <span className="block font-medium mb-1">Profile not found.</span>
                                  <span className="text-muted-foreground text-xs">Uncheck "Is CBT member?" to enter their name manually for now.</span>
                                </CommandEmpty>
                                <CommandGroup>
                                  {allMembers.filter(m => m.id !== initialData?.id).map((m: any) => (
                                    <CommandItem
                                      key={m.id}
                                      value={`${m.first_name} ${m.last_name}`}
                                      onSelect={() => {
                                        form.setValue("spouse_member_id", m.id, { shouldValidate: true })
                                        form.setValue("spouse_name", `${m.first_name} ${m.last_name}`, { shouldValidate: true })
                                        const occ = m.position || m.company || ""
                                        if (occ) form.setValue("spouse_occupation", occ, { shouldValidate: true })
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4 text-primary",
                                          form.watch("spouse_member_id") === m.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {m.first_name} {m.last_name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label className="text-[13px] text-muted-foreground">Spouse Full Name</Label>
                          <Input {...form.register("spouse_name")} className="h-12 bg-transparent" placeholder="Name of Spouse" />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-[13px] text-muted-foreground">Spouse Occupation</Label>
                          <Input {...form.register("spouse_occupation")} className="h-12 bg-transparent" placeholder="e.g. Teacher, Engineer" />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Spiritual details */}
              <div className="col-span-1 md:col-span-2 mt-4 mb-2">
                <h4 className="font-semibold text-lg border-b pb-2">Spiritual & Church Background</h4>
              </div>

              {!isInvite && (
                <div className="grid gap-2 col-span-1 md:col-span-2">
                  <Label className="text-[13px] text-muted-foreground font-medium">Church Role / Position</Label>
                  <Select value={form.watch("church_role") || "Member"} onValueChange={(val) => form.setValue("church_role", val, { shouldValidate: true, shouldDirty: true })}>
                    <SelectTrigger className="h-12 w-full bg-transparent">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Main Pastor">Main Pastor</SelectItem>
                      <SelectItem value="Mission Pastor">Mission Pastor</SelectItem>
                      <SelectItem value="Ministry Leader">Ministry Leader</SelectItem>
                      <SelectItem value="Member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.watch("church_role") === "Main Pastor" && (
                    <p className="text-xs text-amber-500 font-medium">Note: Designating this member as Main Pastor will automatically set them as Senior Leader in the Org Chart.</p>
                  )}
                </div>
              )}

              <div className="grid gap-2 col-span-1 md:col-span-2">
                <Label className="text-[13px] text-muted-foreground font-medium flex items-center gap-1.5">
                  <Church className="h-4 w-4 text-primary" /> CBT Location / Mission Branch
                </Label>
                <Select 
                  value={form.watch("mission_id") || "main"} 
                  onValueChange={(val) => form.setValue("mission_id", val, { shouldValidate: true, shouldDirty: true })}
                >
                  <SelectTrigger className="h-12 w-full bg-transparent font-medium">
                    <SelectValue placeholder="Select CBT Location / Mission Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">CBT Olongapo (Main Church)</SelectItem>
                    {missions.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} {m.location ? `(${m.location})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Default is CBT Olongapo (Main Church). Select a mission branch if member is assigned to an outreach branch.
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label className="text-[13px] text-muted-foreground">Membership Date (Joined CBT)</Label>
                <DatePicker value={form.watch("membership_date")} onChange={(v) => form.setValue("membership_date", v, { shouldValidate: true, shouldDirty: true })} placeholder="Select date" className="h-12 w-full" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] text-muted-foreground">Date Saved (Salvation)</Label>
                <DatePicker value={form.watch("date_saved")} onChange={(v) => form.setValue("date_saved", v, { shouldValidate: true, shouldDirty: true })} placeholder="Select date" className="h-12 w-full" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] text-muted-foreground">Baptism Date</Label>
                <DatePicker value={form.watch("baptism_date")} onChange={(v) => form.setValue("baptism_date", v, { shouldValidate: true, shouldDirty: true })} placeholder="Select date" className="h-12 w-full" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] text-muted-foreground">Baptized By</Label>
                <Input {...form.register("baptized_by")} className="h-12 bg-transparent" placeholder="Name of Pastor" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] text-muted-foreground">Witness By</Label>
                <Input {...form.register("witness_by")} className="h-12 bg-transparent" placeholder="Witnesses" />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[13px] text-muted-foreground">Place of Baptism</Label>
                </div>
                <Input {...form.register("place_of_baptism")} className="h-12 bg-transparent" placeholder="Church Name / Location" />
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="sameAsMotherChurch"
                    checked={
                      form.watch("place_of_baptism") === "CBT Olongapo" || 
                      form.watch("place_of_baptism") === "CBT (Mother Church)" || 
                      form.watch("place_of_baptism") === "CBT"
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        form.setValue("place_of_baptism", "CBT Olongapo", { shouldValidate: true, shouldDirty: true })
                      } else {
                        form.setValue("place_of_baptism", "", { shouldValidate: true, shouldDirty: true })
                      }
                    }}
                    className="h-4 w-4 rounded border-input bg-transparent text-primary focus:ring-primary cursor-pointer accent-primary"
                  />
                  <label htmlFor="sameAsMotherChurch" className="text-xs text-muted-foreground cursor-pointer select-none font-medium flex items-center gap-1.5 hover:text-foreground transition-colors">
                    <Church className="h-3.5 w-3.5 text-primary" />
                    Baptized at CBT Olongapo
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ADDRESS (Dedicated Wizard Step) */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-2 border-b pb-2 flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" /> Current Residence Address
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Please enter your present living address.</p>

              {/* Quick Select Chips */}
              <div className="p-4 rounded-xl border bg-muted/20 space-y-2 mb-6">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Quick Select Olongapo Barangays & Nearby:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {OLONGAPO_BARANGAYS.slice(0, 8).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyAddressPreset(preset, "current")}
                      className="text-xs px-3 py-1 rounded-full border bg-card hover:bg-primary hover:text-primary-foreground transition-colors font-medium shadow-2xs"
                    >
                      📍 {preset.barangay}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="grid gap-2">
                  <Label className="text-[13px] text-muted-foreground">House / Lot No.</Label>
                  <Input {...form.register("house_number")} className="h-12 bg-transparent" placeholder="e.g. 123" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[13px] text-muted-foreground">Unit / Apt No.</Label>
                  <Input {...form.register("unit_number")} className="h-12 bg-transparent" placeholder="e.g. Unit 4B" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[13px] text-muted-foreground">Street</Label>
                  <Input {...form.register("street")} className="h-12 bg-transparent" placeholder="e.g. Main Street" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[13px] text-muted-foreground">Barangay</Label>
                  <Input 
                    list="current-barangay-list" 
                    {...form.register("barangay")} 
                    onChange={(e) => {
                      const val = e.target.value
                      form.setValue("barangay", val)
                      const match = ALL_ADDRESS_PRESETS.find(p => p.barangay.toLowerCase() === val.trim().toLowerCase())
                      if (match) {
                        applyAddressPreset(match, "current")
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Tab" || e.key === "Enter") {
                        const val = (e.target as HTMLInputElement).value
                        handleBarangayAutoSelect(val, "current")
                      }
                    }}
                    onBlur={(e) => {
                      const val = e.target.value
                      handleBarangayAutoSelect(val, "current")
                    }}
                    className="h-12 bg-transparent" 
                    placeholder="e.g. Gordon Heights" 
                  />
                  <datalist id="current-barangay-list">
                    {ALL_ADDRESS_PRESETS.map((p, idx) => (
                      <option key={idx} value={p.barangay}>{`${p.barangay} (${p.city}, ${p.province} ${p.zip_code})`}</option>
                    ))}
                  </datalist>
                </div>
                <div className="grid gap-2">
                  <Label className="text-[13px] text-muted-foreground">City / Municipality</Label>
                  <Input {...form.register("city")} className="h-12 bg-transparent" placeholder="e.g. Olongapo City" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[13px] text-muted-foreground">Province</Label>
                  <Input {...form.register("province")} className="h-12 bg-transparent" placeholder="e.g. Zambales" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[13px] text-muted-foreground">ZIP Code</Label>
                  <Input {...form.register("zip_code")} className="h-12 bg-transparent" placeholder="e.g. 2200" />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label className="text-[13px] text-muted-foreground">Country</Label>
                  <Input {...form.register("country")} className="h-12 bg-transparent" defaultValue="Philippines" />
                </div>
              </div>
            </div>

            {/* Same address Checkbox */}
            <div className="pt-4 border-t">
              <label className="flex items-center gap-3 cursor-pointer select-none group w-fit p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isPermSame ? "bg-primary border-primary" : "border-muted-foreground/40 group-hover:border-primary"}`}>
                  {isPermSame && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                </div>
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={isPermSame} 
                  onChange={e => {
                    const checked = e.target.checked
                    form.setValue("is_perm_same_as_current", checked)
                    if (checked) {
                      form.setValue("perm_house_number", form.getValues("house_number"))
                      form.setValue("perm_unit_number", form.getValues("unit_number"))
                      form.setValue("perm_street", form.getValues("street"))
                      form.setValue("perm_barangay", form.getValues("barangay"))
                      form.setValue("perm_city", form.getValues("city"))
                      form.setValue("perm_province", form.getValues("province"))
                      form.setValue("perm_zip_code", form.getValues("zip_code"))
                      form.setValue("perm_country", form.getValues("country"))
                    }
                  }} 
                />
                <div>
                  <span className="font-semibold text-sm">Permanent address is the same as Current address</span>
                  <p className="text-xs text-muted-foreground">Uncheck this if your permanent home address is different</p>
                </div>
              </label>
            </div>

            {/* Permanent Address */}
            <div className="pt-2">
              <h3 className="text-xl font-semibold mb-2 border-b pb-2 flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" /> Permanent Address
              </h3>

              {isPermSame ? (
                <div className="p-4 rounded-xl border bg-primary/5 border-primary/20 text-sm text-muted-foreground flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span>Permanent address is automatically synchronized with Current Address.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 animate-in fade-in duration-300">
                  <div className="grid gap-2">
                    <Label className="text-[13px] text-muted-foreground">House / Lot No.</Label>
                    <Input {...form.register("perm_house_number")} className="h-12 bg-transparent" placeholder="e.g. 123" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[13px] text-muted-foreground">Unit / Apt No.</Label>
                    <Input {...form.register("perm_unit_number")} className="h-12 bg-transparent" placeholder="e.g. Unit 4B" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[13px] text-muted-foreground">Street</Label>
                    <Input {...form.register("perm_street")} className="h-12 bg-transparent" placeholder="e.g. Main Street" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[13px] text-muted-foreground">Barangay</Label>
                    <Input 
                      list="perm-barangay-list" 
                      {...form.register("perm_barangay")} 
                      onChange={(e) => {
                        const val = e.target.value
                        form.setValue("perm_barangay", val)
                        const match = ALL_ADDRESS_PRESETS.find(p => p.barangay.toLowerCase() === val.trim().toLowerCase())
                        if (match) {
                          applyAddressPreset(match, "permanent")
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Tab" || e.key === "Enter") {
                          const val = (e.target as HTMLInputElement).value
                          handleBarangayAutoSelect(val, "permanent")
                        }
                      }}
                      onBlur={(e) => {
                        const val = e.target.value
                        handleBarangayAutoSelect(val, "permanent")
                      }}
                      className="h-12 bg-transparent" 
                      placeholder="e.g. Gordon Heights" 
                    />
                    <datalist id="perm-barangay-list">
                      {ALL_ADDRESS_PRESETS.map((p, idx) => (
                        <option key={idx} value={p.barangay}>{`${p.barangay} (${p.city}, ${p.province} ${p.zip_code})`}</option>
                      ))}
                    </datalist>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[13px] text-muted-foreground">City / Municipality</Label>
                    <Input {...form.register("perm_city")} className="h-12 bg-transparent" placeholder="e.g. Olongapo City" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[13px] text-muted-foreground">Province</Label>
                    <Input {...form.register("perm_province")} className="h-12 bg-transparent" placeholder="e.g. Zambales" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[13px] text-muted-foreground">ZIP Code</Label>
                    <Input {...form.register("perm_zip_code")} className="h-12 bg-transparent" placeholder="e.g. 2200" />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label className="text-[13px] text-muted-foreground">Country</Label>
                    <Input {...form.register("perm_country")} className="h-12 bg-transparent" defaultValue="Philippines" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: MEDICAL & HEALTH */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-6">
            <h3 className="text-xl font-semibold border-b pb-2">Medical & Health Information</h3>
            <p className="text-sm text-muted-foreground -mt-3">
              Providing this information is optional but highly recommended to help church organizers ensure safety during retreats, camps, and activities.
            </p>
            <div className="grid gap-6">
              <div className="grid gap-2 max-w-xs">
                <Label className="text-[13px] text-muted-foreground">Blood Type</Label>
                <Select onValueChange={(val) => form.setValue("blood_type", val)} value={form.watch("blood_type") || ""}>
                  <SelectTrigger className="h-12 bg-transparent"><SelectValue placeholder="Select Blood Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="I don't know">I don't know</SelectItem>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-[13px] text-muted-foreground">Allergies (Food, Drugs, etc.)</Label>
                <Input {...form.register("allergies")} className="h-12 bg-transparent" placeholder="e.g. Peanuts, Penicillin (Leave blank if none)" />
              </div>

              <div className="grid gap-2">
                <Label className="text-[13px] text-muted-foreground">Medical Conditions</Label>
                <textarea 
                  {...form.register("medical_conditions")} 
                  className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="e.g. Asthma, Hypertension, Diabetes (Leave blank if none)"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: EMPLOYMENT & ACADEMIC STATUS */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-6">
            <h3 className="text-xl font-semibold border-b pb-2">Employment & Status</h3>
            <div className="grid gap-2 max-w-xs">
              <Label className="text-[13px] text-muted-foreground">Status<R/></Label>
              <select {...form.register("employment_status")} className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-1">
                <option value="None">None / Unemployed</option>
                <option value="Student">Student</option>
                <option value="Employed">Employed</option>
              </select>
            </div>

            {employmentStatus === "Student" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl border bg-muted/20">
                <div className="grid gap-2">
                  <Label className="text-[13px] text-muted-foreground font-medium">Education Level</Label>
                  <select 
                    {...form.register("student_level")} 
                    className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="College">College / University</option>
                    <option value="Senior High School">Senior High School (SHS)</option>
                    <option value="High School">High School (JHS)</option>
                    <option value="Elementary">Elementary</option>
                    <option value="Vocational">Vocational</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-[13px] text-muted-foreground">School / University</Label>
                  <Input {...form.register("student_school")} className="h-12 bg-transparent" placeholder="e.g. Subic Bay Colleges" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[13px] text-muted-foreground">Year Level</Label>
                  <Input {...form.register("student_year_level")} className="h-12 bg-transparent" placeholder="e.g. 3rd Year" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[13px] text-muted-foreground">Course / Track / Strand</Label>
                  <Input {...form.register("student_course")} className="h-12 bg-transparent" placeholder="e.g. BS IT" />
                </div>
              </div>
            )}

            {employmentStatus === "Employed" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl border bg-muted/20">
                <div className="grid gap-2">
                  <Label className="text-[13px] text-muted-foreground">Company / Organization<R/></Label>
                  <Input {...form.register("company")} className="h-12 bg-transparent" />
                  {form.formState.errors.company && <p className="text-sm text-destructive">{form.formState.errors.company.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label className="text-[13px] text-muted-foreground">Position / Title<R/></Label>
                  <Input {...form.register("position")} className="h-12 bg-transparent" />
                  {form.formState.errors.position && <p className="text-sm text-destructive">{form.formState.errors.position.message}</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: FAMILY & EMERGENCY CONTACT */}
        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-8">
            <h3 className="text-xl font-semibold border-b pb-2">Family & Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl border space-y-4">
                <h4 className="font-semibold text-primary">Father's Info</h4>
                {renderMemberSelect("Select Father (Member)", "father_member_id", "father_name", "father_is_member", initialData?.id, "father_occupation", "father_contact_number", "Male")}
                <Input {...form.register("father_name")} placeholder="Father's Name" className="h-11 bg-transparent" />
                <Input {...form.register("father_occupation")} placeholder="Father's Occupation" className="h-11 bg-transparent" />
                <Input {...form.register("father_contact_number")} placeholder="Father's Contact Number" className="h-11 bg-transparent" />
              </div>
              <div className="p-4 rounded-xl border space-y-4">
                <h4 className="font-semibold text-primary">Mother's Info</h4>
                {renderMemberSelect("Select Mother (Member)", "mother_member_id", "mother_name", "mother_is_member", initialData?.id, "mother_occupation", "mother_contact_number", "Female")}
                <Input {...form.register("mother_name")} placeholder="Mother's Name" className="h-11 bg-transparent" />
                <Input {...form.register("mother_occupation")} placeholder="Mother's Occupation" className="h-11 bg-transparent" />
                <Input {...form.register("mother_contact_number")} placeholder="Mother's Contact Number" className="h-11 bg-transparent" />
              </div>
            </div>

            <div className="grid gap-2 max-w-sm">
              <Label className="text-[13px] text-muted-foreground">Parents' Civil Status</Label>
              <div className="relative flex items-center">
                <select 
                  {...form.register("parents_civil_status")} 
                  className={cn(
                    "flex appearance-none h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0",
                    !form.watch("parents_civil_status") ? "text-muted-foreground" : "text-foreground"
                  )}
                >
                  <option value="" className="bg-card text-muted-foreground">Select Civil Status...</option>
                  <option value="Married" className="bg-card text-foreground">Married</option>
                  <option value="Single Parent" className="bg-card text-foreground">Single Parent</option>
                  <option value="Widowed" className="bg-card text-foreground">Widowed</option>
                  <option value="Separated" className="bg-card text-foreground">Separated</option>
                  <option value="Divorced" className="bg-card text-foreground">Divorced</option>
                  <option value="Annulled" className="bg-card text-foreground">Annulled</option>
                  <option value="Living Together" className="bg-card text-foreground">Living Together / Co-habitating</option>
                  <option value="Deceased" className="bg-card text-foreground">Deceased (Both)</option>
                  <option value="Other" className="bg-card text-foreground">Other / Not Specified</option>
                </select>
                <ChevronDown className="absolute right-3 h-4 w-4 text-muted-foreground opacity-50 pointer-events-none" />
              </div>
            </div>

            {/* Siblings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-semibold text-lg">Siblings</h4>
                <Button type="button" variant="outline" size="sm" onClick={() => appendSibling({ name: "", birth_date: "", sibling_is_member: false, sibling_member_id: "" })} className="gap-1.5">
                  <Plus className="h-4 w-4" /> Add Sibling
                </Button>
              </div>
              {siblingFields.map((field, index) => (
                <div key={field.id} className="p-4 rounded-xl border space-y-4 bg-muted/10 relative">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeSibling(index)} className="absolute top-2 right-2 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="grid gap-2">
                      <Label className="text-[13px] text-muted-foreground">Name<R/></Label>
                      <Input {...form.register(`siblings.${index}.name`)} placeholder="Sibling's Name" className="h-11 bg-transparent" />
                      {form.formState.errors.siblings?.[index]?.name && <p className="text-sm text-destructive">{form.formState.errors.siblings[index].name.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[13px] text-muted-foreground">Birth Date</Label>
                      <DatePicker
                        value={form.watch(`siblings.${index}.birth_date`)}
                        onChange={(v) => form.setValue(`siblings.${index}.birth_date`, v, { shouldValidate: true, shouldDirty: true })}
                        placeholder="Select birth date"
                        className="h-11 w-full"
                      />
                    </div>
                  </div>
                  {renderMemberSelect("Select Sibling (Member)", `siblings.${index}.sibling_member_id`, `siblings.${index}.name`, `siblings.${index}.sibling_is_member`, initialData?.id)}
                </div>
              ))}
            </div>

            {/* Children */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-semibold text-lg">Children</h4>
                <Button type="button" variant="outline" size="sm" onClick={() => appendChild({ name: "", birth_date: "", is_cbt_member: false, child_member_id: "" })} className="gap-1.5">
                  <Plus className="h-4 w-4" /> Add Child
                </Button>
              </div>
              {childFields.map((field, index) => (
                <div key={field.id} className="p-4 rounded-xl border space-y-4 bg-muted/10 relative">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeChild(index)} className="absolute top-2 right-2 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="grid gap-2">
                      <Label className="text-[13px] text-muted-foreground">Name<R/></Label>
                      <Input {...form.register(`children.${index}.name`)} placeholder="Child's Name" className="h-11 bg-transparent" />
                      {form.formState.errors.children?.[index]?.name && <p className="text-sm text-destructive">{form.formState.errors.children[index].name.message}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[13px] text-muted-foreground">Birth Date</Label>
                      <DatePicker
                        value={form.watch(`children.${index}.birth_date`)}
                        onChange={(v) => form.setValue(`children.${index}.birth_date`, v, { shouldValidate: true, shouldDirty: true })}
                        placeholder="Select birth date"
                        className="h-11 w-full"
                      />
                    </div>
                  </div>
                  {renderMemberSelect("Select Child (Member)", `children.${index}.child_member_id`, `children.${index}.name`, `children.${index}.is_cbt_member`, initialData?.id)}
                </div>
              ))}
            </div>

            {/* Emergency Contact */}
            <div className="p-5 rounded-xl border bg-amber-500/5 border-amber-500/20 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h4 className="font-semibold text-amber-600 dark:text-amber-400">Emergency Contact Person</h4>
                
                {/* Segmented Control / Toggle */}
                <div className="flex bg-muted p-1 rounded-lg w-full sm:w-auto self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEmergencyMember(true)
                      form.setValue("emergency_contact_name", "", { shouldDirty: true })
                      form.setValue("emergency_contact_number", "", { shouldDirty: true })
                      form.setValue("emergency_contact_relationship", "", { shouldDirty: true })
                    }}
                    className={cn(
                      "flex-1 sm:flex-none text-xs font-medium px-4 py-1.5 rounded-md transition-colors",
                      isEmergencyMember ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Select Member
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEmergencyMember(false)
                      form.setValue("emergency_contact_member_id", null, { shouldDirty: true })
                    }}
                    className={cn(
                      "flex-1 sm:flex-none text-xs font-medium px-4 py-1.5 rounded-md transition-colors",
                      !isEmergencyMember ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Manual Input
                  </button>
                </div>
              </div>

              {isEmergencyMember ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid gap-2">
                    <Label className="text-xs text-muted-foreground">Search Member</Label>
                    <Popover open={emergencyComboboxOpen} onOpenChange={setEmergencyComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={emergencyComboboxOpen}
                          className="w-full justify-between h-11 bg-transparent border-dashed hover:bg-amber-500/10 hover:text-amber-600 border-amber-500/30"
                        >
                          {form.watch("emergency_contact_name")
                            ? form.watch("emergency_contact_name")
                            : "Search for a member..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] md:w-[384px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search member..." className="h-11" />
                          <CommandList>
                            <CommandEmpty className="py-6 text-center text-sm px-4">
                              <UserX className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                              <p>No member found.</p>
                            </CommandEmpty>
                            <CommandGroup>
                              {allMembers.filter(m => m.id !== initialData?.id).map((m) => {
                                const isSpouse = form.watch("spouse_member_id") === m.id
                                return (
                                  <CommandItem
                                    key={m.id}
                                    value={`${m.first_name} ${m.last_name}`}
                                    onSelect={() => {
                                      form.setValue("emergency_contact_name", `${m.first_name} ${m.last_name}`, { shouldDirty: true, shouldValidate: true })
                                      if (m.contact_number) {
                                        form.setValue("emergency_contact_number", m.contact_number, { shouldDirty: true, shouldValidate: true })
                                      }
                                      // Auto-set relationship based on member context
                                      if (isSpouse) {
                                        form.setValue("emergency_contact_relationship", "Spouse", { shouldDirty: true, shouldValidate: true })
                                      } else {
                                        // Clear relationship so user fills it in for non-spouse
                                        const currentRel = form.getValues("emergency_contact_relationship")
                                        if (currentRel === "Spouse") {
                                          form.setValue("emergency_contact_relationship", "", { shouldDirty: true })
                                        }
                                      }
                                      setEmergencyComboboxOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        form.watch("emergency_contact_name") === `${m.first_name} ${m.last_name}` ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-2">
                                        <span>{m.first_name} {m.last_name}</span>
                                        {isSpouse && (
                                          <span className="text-[10px] font-medium bg-pink-500/10 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded-full">Spouse</span>
                                        )}
                                      </div>
                                      {m.contact_number && (
                                        <span className="text-xs text-muted-foreground">{m.contact_number}</span>
                                      )}
                                    </div>
                                  </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Mobile Number</Label>
                      <Input {...form.register("emergency_contact_number")} readOnly className="h-11 bg-transparent text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground text-amber-600 dark:text-amber-400">Relationship {form.watch("emergency_contact_relationship") === "Spouse" ? "(Auto-detected)" : "(Required)"}</Label>
                      <Input 
                        {...form.register("emergency_contact_relationship")} 
                        placeholder="e.g. Spouse, Parent, Sibling" 
                        readOnly={form.watch("emergency_contact_relationship") === "Spouse"}
                        className={cn(
                          "h-11",
                          form.watch("emergency_contact_relationship") === "Spouse" 
                            ? "bg-transparent text-muted-foreground" 
                            : "bg-background/50 border-amber-500/40 focus-visible:ring-amber-500/50"
                        )} 
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-200">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <Input {...form.register("emergency_contact_name")} placeholder="Full Name" className="h-11 bg-transparent" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Relationship</Label>
                    <Input {...form.register("emergency_contact_relationship")} placeholder="e.g. Spouse, Parent" className="h-11 bg-transparent" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Mobile Number</Label>
                    <Input {...form.register("emergency_contact_number")} placeholder="Mobile Number" className="h-11 bg-transparent" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 6: EDUCATION BACKGROUND */}
        {step === 6 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-8">
            <h3 className="text-xl font-semibold border-b pb-2">Education Background</h3>
            
            <div className="grid gap-2.5 max-w-md">
              <Label>Highest Educational Attainment<R/></Label>
              <select {...form.register("highest_educational_attainment")} className="flex h-12 w-full rounded-md border border-input bg-background text-foreground px-3 py-1">
                <option value="" className="bg-background">Select...</option>
                <option value="None" className="bg-background">None</option>
                <option value="Elementary" className="bg-background">Elementary</option>
                <option value="High School" className="bg-background">High School</option>
                <option value="Senior High School" className="bg-background">Senior High School</option>
                <option value="Vocational" className="bg-background">Vocational</option>
                <option value="College" className="bg-background">College</option>
                <option value="Postgraduate" className="bg-background">Postgraduate</option>
              </select>
            </div>

            <div className="space-y-6">
              {eduFields.map((field, index) => {
                const isEnrolled = form.watch(`education_details.${index}.is_currently_enrolled`)
                const levelName = form.getValues(`education_details.${index}.level`)
                const isHighest = levelName === highestAttainment

                return (
                  <div key={field.id} className="p-5 rounded-xl border bg-card space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-lg">{levelName}</span>
                      {isHighest && <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">Highest Level</span>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="grid gap-2 md:col-span-3">
                        <Label className="text-xs text-muted-foreground">School Name</Label>
                        <Input {...form.register(`education_details.${index}.school_name`)} className="h-11 bg-transparent" />
                        {employmentStatus === "Student" && isEnrolled && (
                          <p className="text-[11px] text-primary font-medium flex items-center gap-1 mt-0.5">
                            <Sparkles className="h-3 w-3 text-primary" /> Synced with Student Status (Step 4)
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs text-muted-foreground">Year Started (Optional)</Label>
                        <Input {...form.register(`education_details.${index}.year_started`)} placeholder="e.g. 2015" className="h-11 bg-transparent" />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs text-muted-foreground">Year Graduated (Optional)</Label>
                        <Input {...form.register(`education_details.${index}.year_graduated`)} disabled={isEnrolled} placeholder={isEnrolled ? "Enrolled" : "e.g. 2019"} className="h-11 bg-transparent" />
                      </div>
                      {isHighest && (
                        <div className="flex items-center gap-2 pt-6">
                          <input type="checkbox" id={`enrolled-${index}`} {...form.register(`education_details.${index}.is_currently_enrolled`)} className="rounded" />
                          <label htmlFor={`enrolled-${index}`} className="text-xs font-medium cursor-pointer select-none">Currently Enrolled</label>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 7: COMMITMENT & MINISTRIES */}
        {step === 7 && (() => {
          const topLevelMinistries = ministries.filter(m => !m.parent_id)
          const getChildren = (parentId: string) => ministries.filter(m => m.parent_id === parentId)
          const orphanChildren = ministries.filter(m => m.parent_id && !topLevelMinistries.some(p => p.id === m.parent_id))
          const currentMins: string[] = form.watch("ministries") || []

          return (
            <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-8">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="text-xl font-semibold">Ministries & Pledges</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Select the ministries and sub-ministries this member belongs to.</p>
                </div>
                <span className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                  {currentMins.length} {currentMins.length === 1 ? "Ministry" : "Ministries"} Selected
                </span>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topLevelMinistries.map((parent) => {
                    const children = getChildren(parent.id)
                    const hasChildren = children.length > 0
                    const isParentMandatory = parent.for_everyone || parent.name.toLowerCase().includes("evangelistic")
                    const isParentSelected = isParentMandatory || currentMins.includes(parent.id)
                    const selectedChildrenCount = children.filter(c => currentMins.includes(c.id)).length

                    return (
                      <div 
                        key={parent.id} 
                        onClick={() => {
                          if (isParentMandatory) return
                          let newMins = [...currentMins]
                          if (isParentSelected) {
                            const childIds = children.map(c => c.id)
                            newMins = newMins.filter(id => id !== parent.id && !childIds.includes(id))
                          } else {
                            if (!newMins.includes(parent.id)) newMins.push(parent.id)
                          }
                          form.setValue("ministries", newMins)
                        }}
                        className={cn(
                          "rounded-2xl border p-5 transition-all shadow-2xs flex flex-col justify-between space-y-4",
                          !isParentMandatory && "cursor-pointer select-none hover:shadow-xs",
                          isParentSelected 
                            ? "border-primary/60 bg-primary/5 dark:bg-primary/10 shadow-sm" 
                            : "border-border/60 bg-card hover:border-primary/40"
                        )}
                      >
                        {/* Parent Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-base tracking-tight">{parent.name}</span>
                              {isParentMandatory && (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30">
                                  Required
                                </span>
                              )}
                            </div>
                            {hasChildren && (
                              <p className="text-xs text-muted-foreground">
                                {selectedChildrenCount > 0 
                                  ? `${selectedChildrenCount} of ${children.length} sub-ministries active`
                                  : `${children.length} sub-ministries available`}
                              </p>
                            )}
                          </div>

                          {/* Parent Checkbox Indicator */}
                          <div
                            className={cn(
                              "w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 mt-0.5 select-none",
                              isParentMandatory 
                                ? "bg-primary/30 border-primary text-primary-foreground cursor-not-allowed"
                                : isParentSelected 
                                  ? "bg-primary border-primary text-primary-foreground shadow-2xs cursor-pointer" 
                                  : "border-muted-foreground/40 hover:border-primary cursor-pointer"
                            )}
                          >
                            {isParentSelected && <Check className="h-4 w-4 stroke-[3]" />}
                          </div>
                        </div>

                        {/* Nested Sub-ministries */}
                        {hasChildren && (
                          <div 
                            className="pt-3 border-t border-border/40 space-y-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                              Sub-Ministries:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {children.map((child) => {
                                const isChildSelected = currentMins.includes(child.id)
                                const isChildMandatory = child.for_everyone || child.name.toLowerCase().includes("evangelistic")

                                return (
                                  <button
                                    key={child.id}
                                    type="button"
                                    disabled={isChildMandatory}
                                    onClick={() => {
                                      if (isChildMandatory) return
                                      let newMins = [...currentMins]
                                      if (isChildSelected) {
                                        newMins = newMins.filter(id => id !== child.id)
                                      } else {
                                        newMins.push(child.id)
                                        // Auto-select parent when a child is selected
                                        if (!newMins.includes(parent.id)) {
                                          newMins.push(parent.id)
                                        }
                                      }
                                      form.setValue("ministries", newMins)
                                    }}
                                    className={cn(
                                      "text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-medium transition-all select-none",
                                      isChildSelected
                                        ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                                        : "bg-muted/40 hover:bg-muted text-foreground border-border/60 hover:border-primary/40"
                                    )}
                                  >
                                    {isChildSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                    <span>{child.name}</span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Orphan Sub-ministries (if any) */}
                {orphanChildren.length > 0 && (
                  <div className="pt-4 border-t space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground">Other Sub-Ministries</h4>
                    <div className="flex flex-wrap gap-2">
                      {orphanChildren.map((child) => {
                        const isChildSelected = currentMins.includes(child.id)
                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => {
                              let newMins = [...currentMins]
                              if (isChildSelected) {
                                newMins = newMins.filter(id => id !== child.id)
                              } else {
                                newMins.push(child.id)
                              }
                              form.setValue("ministries", newMins)
                            }}
                            className={cn(
                              "text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-medium transition-all select-none",
                              isChildSelected
                                ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                                : "bg-card hover:bg-muted text-foreground border-border/60 hover:border-primary/40"
                            )}
                          >
                            {isChildSelected && <Check className="h-3 w-3 stroke-[3]" />}
                            <span>{child.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* STEP 7: REVIEW SUMMARY */}
        {step === 8 && (() => {
          const v = form.getValues()
          const currentMins: string[] = v.ministries || []
          const selectedMinistryObjects = ministries.filter(m => currentMins.includes(m.id) || m.for_everyone || m.name.toLowerCase().includes("evangelistic"))
          const siblingsList = v.siblings || []

          const firstName = v.first_name || ""
          const middleName = v.middle_name || ""
          const lastName = v.last_name || ""
          const gender = v.gender || ""
          const birthDate = v.birth_date || ""
          const contactNumber = v.contact_number || ""
          const empStatus = v.employment_status || ""
          const highestEdu = v.highest_educational_attainment || ""
          const studentSchool = v.student_school || ""
          const studentYear = v.student_year_level || ""
          const studentCourse = v.student_course || ""
          const company = v.company || ""
          const position = v.position || ""
          const fatherName = v.father_name || ""
          const motherName = v.mother_name || ""
          const parentsCivil = v.parents_civil_status || ""
          const emergencyName = v.emergency_contact_name || ""
          const emergencyRel = v.emergency_contact_relationship || ""
          const emergencyNum = v.emergency_contact_number || ""
          const dateSaved = v.date_saved || ""
          const membershipDate = v.membership_date || ""
          const baptismDate = v.baptism_date || ""
          const baptizedBy = v.baptized_by || ""
          const witnessBy = v.witness_by || ""
          const placeOfBaptism = v.place_of_baptism || ""

          return (
            <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-6">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="text-xl font-semibold">Review Member Record</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Please verify all information before saving the record.</p>
                </div>
                <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                  Ready for Submission
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                {/* 1. Personal & Demographics */}
                <div className="p-5 rounded-2xl border bg-card space-y-3 shadow-2xs">
                  <h4 className="font-bold text-base border-b pb-2 flex items-center gap-2 text-primary">
                    <User className="h-4 w-4" /> Personal Profile
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Full Name</span>
                      <span className="font-semibold text-sm">{firstName} {middleName} {lastName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Gender</span>
                      <span className="font-medium">{gender || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Date of Birth</span>
                      <span className="font-medium">{birthDate || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Contact Number</span>
                      <span className="font-medium">{contactNumber || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Address Details */}
                <div className="p-5 rounded-2xl border bg-card space-y-3 shadow-2xs">
                  <h4 className="font-bold text-base border-b pb-2 flex items-center gap-2 text-primary">
                    <Home className="h-4 w-4" /> Residential Addresses
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground font-semibold block">Current Address:</span>
                      <span className="font-medium">
                        {[
                          v.house_number,
                          v.unit_number,
                          v.street,
                          v.barangay,
                          v.city,
                          v.province,
                          v.zip_code,
                          v.country
                        ].filter(Boolean).join(" ") || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-semibold block">Permanent Address:</span>
                      <span className="font-medium">
                        {isPermSame ? (
                          <span className="text-muted-foreground italic">Same as Current Address</span>
                        ) : (
                          [
                            v.perm_house_number,
                            v.perm_unit_number,
                            v.perm_street,
                            v.perm_barangay,
                            v.perm_city,
                            v.perm_province,
                            v.perm_zip_code,
                            v.perm_country
                          ].filter(Boolean).join(" ") || "—"
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Employment & Academic Status */}
                <div className="p-5 rounded-2xl border bg-card space-y-3 shadow-2xs">
                  <h4 className="font-bold text-base border-b pb-2 flex items-center gap-2 text-primary">
                    <Briefcase className="h-4 w-4" /> Employment & Education
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Employment Status</span>
                      <span className="font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-md inline-block mt-0.5">{empStatus || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Highest Attainment</span>
                      <span className="font-semibold text-foreground">{highestEdu || "—"}</span>
                    </div>
                    {empStatus === "Student" && (
                      <div className="col-span-2 space-y-1 pt-2 border-t">
                        <p><span className="text-muted-foreground">School:</span> <span className="font-medium text-foreground">{studentSchool || "—"}</span></p>
                        <p><span className="text-muted-foreground">Year & Course:</span> <span className="font-medium text-foreground">{[studentYear, studentCourse].filter(Boolean).join(" - ") || "—"}</span></p>
                      </div>
                    )}
                    {empStatus === "Employed" && (
                      <div className="col-span-2 space-y-1 pt-2 border-t">
                        <p><span className="text-muted-foreground">Company:</span> <span className="font-medium text-foreground">{company || "—"}</span></p>
                        <p><span className="text-muted-foreground">Position:</span> <span className="font-medium text-foreground">{position || "—"}</span></p>
                      </div>
                    )}
                    
                    {/* Education Details List */}
                    {v.education_details && v.education_details.some((e: any) => e.school_name) && (
                      <div className="col-span-2 pt-2 border-t space-y-2">
                        <span className="text-muted-foreground font-semibold block">Education History:</span>
                        <div className="space-y-1.5">
                          {v.education_details.filter((e: any) => e.school_name).map((edu: any, i: number) => (
                            <div key={i} className="p-2 rounded-lg bg-muted/30 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-semibold block">{edu.level}: {edu.school_name}</span>
                                {edu.is_currently_enrolled ? (
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Currently Enrolled</span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">
                                    {[edu.year_started, edu.year_graduated].filter(Boolean).join(" - ")}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Family & Emergency Contact */}
                <div className="p-5 rounded-2xl border bg-card space-y-3 shadow-2xs">
                  <h4 className="font-bold text-base border-b pb-2 flex items-center gap-2 text-primary">
                    <Heart className="h-4 w-4" /> Family & Emergency Contact
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Father's Name</span>
                      <span className="font-medium">{fatherName || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Mother's Name</span>
                      <span className="font-medium">{motherName || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Parents' Civil Status</span>
                      <span className="font-medium">{parentsCivil || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Siblings</span>
                      <span className="font-medium">{siblingsList.length > 0 ? `${siblingsList.length} recorded` : "None"}</span>
                    </div>
                    <div className="col-span-2 pt-2 border-t text-amber-600 dark:text-amber-400">
                      <span className="font-semibold block">Emergency Contact:</span>
                      <p>{emergencyName || "—"} ({emergencyRel || "Contact"}) - {emergencyNum || "No phone"}</p>
                    </div>
                  </div>
                </div>

                {/* 5. Spiritual & Church Background */}
                <div className="p-5 rounded-2xl border bg-card space-y-3 shadow-2xs">
                  <h4 className="font-bold text-base border-b pb-2 flex items-center gap-2 text-primary">
                    <Church className="h-4 w-4" /> Spiritual & Church Background
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Membership Date</span>
                      <span className="font-semibold text-primary">{membershipDate || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Date Saved</span>
                      <span className="font-medium">{dateSaved || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Baptism Date</span>
                      <span className="font-medium">{baptismDate || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Baptized By</span>
                      <span className="font-medium">{baptizedBy || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Witness By</span>
                      <span className="font-medium">{witnessBy || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Place of Baptism</span>
                      <span className="font-medium">{placeOfBaptism || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* 6. Selected Ministries */}
                <div className="p-5 rounded-2xl border bg-card space-y-3 shadow-2xs">
                  <h4 className="font-bold text-base border-b pb-2 flex items-center justify-between text-primary">
                    <span>Ministries Enrolled</span>
                    <span className="text-xs font-normal text-muted-foreground">{selectedMinistryObjects.length} active</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedMinistryObjects.length > 0 ? (
                      selectedMinistryObjects.map((m) => (
                        <span 
                          key={m.id}
                          className="text-xs px-3 py-1 rounded-full border bg-primary/10 text-primary border-primary/20 font-medium flex items-center gap-1.5"
                        >
                          <Check className="h-3 w-3 stroke-[3]" />
                          {m.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No ministries selected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

          {/* RIGHT 4 COLUMNS: Desktop Sticky Live Summary Side Panel */}
          {showSidePanel && (
            <div className="lg:col-span-4 hidden lg:block sticky top-20 space-y-5">
              {/* Live Profile Summary Card */}
              <div className="rounded-2xl border bg-card p-5 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <h4 className="font-bold text-foreground text-sm tracking-tight flex items-center gap-2">
                    <User2 className="h-4 w-4 text-primary" /> Live Profile Preview
                  </h4>
                  <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Step {step} of {STEPS.length}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-xl shadow-inner shrink-0">
                    {form.watch("first_name") || form.watch("last_name") ? `${(form.watch("first_name") || '').charAt(0)}${(form.watch("last_name") || '').charAt(0)}`.toUpperCase() : <User2 className="h-7 w-7 text-primary/70" />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h4 className="font-bold text-foreground text-base truncate">
                      {form.watch("first_name") || form.watch("last_name") ? `${form.watch("first_name")} ${form.watch("last_name")}`.trim() : "Member Name"}
                    </h4>
                    <span className="inline-flex items-center text-xs text-primary font-semibold bg-primary/10 px-2.5 py-0.5 rounded-full w-fit mt-1">
                      {form.watch("church_role") || "Member"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs border-t pt-3 text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Date of Birth:</span>
                    <span className="text-foreground font-semibold">
                      {form.watch("birth_date") ? (() => { try { return format(parseISO(form.watch("birth_date")), "MMM d, yyyy") } catch { return form.watch("birth_date") } })() : "Not set"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Contact:</span>
                    <span className="text-foreground font-semibold truncate max-w-[150px]">
                      {form.watch("contact_number") || "Not set"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">City:</span>
                    <span className="text-foreground font-semibold">
                      {form.watch("city") || "Not set"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    <span className="text-foreground font-semibold">
                      {form.watch("employment_status") || "Not set"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Progress Checklist */}
              <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-3">
                <h5 className="font-bold text-sm text-foreground">Form Progress Checklist</h5>
                <div className="space-y-1 pt-1">
                  {STEPS.map((s) => {
                    const isCurrent = step === s.id
                    const isDone = step > s.id
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleStepClick(s.id)}
                        className={cn(
                          "flex items-center justify-between w-full p-2.5 rounded-xl text-xs font-medium transition-all text-left",
                          isCurrent ? "bg-primary text-primary-foreground font-bold shadow-xs" :
                          isDone ? "text-foreground hover:bg-muted/50" : "text-muted-foreground/60 hover:bg-muted/30"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                            isCurrent ? "bg-primary-foreground text-primary" :
                            isDone ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                          )}>
                            {isDone ? <Check className="h-3 w-3" /> : s.id}
                          </div>
                          <span>{s.title}</span>
                        </div>
                        {isCurrent && <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM NAVIGATION BUTTONS */}
        <div className="fixed bottom-0 inset-x-0 sm:relative sm:bottom-auto z-50 flex items-center justify-between gap-3 px-4 py-3 sm:p-0 sm:pt-6 border-t bg-background/95 backdrop-blur-xl sm:bg-transparent shadow-2xl sm:shadow-none pb-safe">
          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              className="h-11 px-6"
            >
              Back
            </Button>
            {!initialData && !isInvite && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleDiscardDraft}
                className="h-11 px-4 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                Discard Draft
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {initialData && step < STEPS.length && (
              <Button 
                type="button"
                variant="outline"
                onClick={() => form.handleSubmit(onSubmit, onInvalid)()}
                disabled={isSubmitting}
                className="h-11 px-5 gap-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>Save Changes</span>
              </Button>
            )}

            {step < STEPS.length ? (
              <Button 
                key="btn-next-step"
                type="button" 
                data-next-btn="true"
                onClick={validateStep}
                className="h-11 px-6 gap-2"
              >
                Next Step
              </Button>
            ) : (
              <Button 
                key="btn-save-member"
                type="button" 
                onClick={() => form.handleSubmit(onSubmit, onInvalid)()}
                disabled={isSubmitting}
                className="h-11 px-8 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save Member Record
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
