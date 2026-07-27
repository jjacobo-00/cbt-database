"use client"

import React, { useState } from "react"
import { toast } from "sonner"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createMember, updateMember } from "@/app/(dashboard)/members/actions"
import { Check, ChevronLeft, ChevronDown, GraduationCap, Briefcase, UserX, Plus, Trash2, MapPin, Building, Home, Sparkles, Save, Loader2, User, Heart, Church } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import Link from "next/link"
import { ALL_ADDRESS_PRESETS, OLONGAPO_BARANGAYS, AddressPreset } from "@/lib/constants/addresses"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
const memberSchema = z.object({
  // Step 1: Personal
  first_name: z.string().min(1, "First name is required"),
  middle_name: z.string().default(""),
  last_name: z.string().min(1, "Last name is required"),
  birth_date: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  contact_number: z.string().regex(/^09\d{9}$/, "Must be a valid 11-digit Philippine mobile number starting with 09"),
  marital_status: z.string().default("Single"),
  is_spouse_cbt_member: z.boolean().default(false),
  spouse_name: z.string().default(""),
  spouse_member_id: z.string().default(""),
  spouse_occupation: z.string().default(""),
  anniversary_date: z.string().default(""),
  
  // Spiritual info
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
  
  // Step 3: Status
  employment_status: z.enum(["Student", "Employed", "None"]),
  student_school: z.string().default(""),
  student_year_level: z.string().default(""),
  student_course: z.string().default(""),
  company: z.string().default(""),
  position: z.string().default(""),
  
  // Step 4: Family
  father_name: z.string().default(""),
  father_occupation: z.string().default(""),
  father_contact_number: z.string().default(""),
  mother_name: z.string().default(""),
  mother_occupation: z.string().default(""),
  mother_contact_number: z.string().default(""),
  parents_civil_status: z.string().default(""),
  siblings: z.array(z.object({
    name: z.string().default(""),
    age: z.string().default(""),
    relationship: z.string().default(""),
  })).default([]),
  emergency_contact_name: z.string().default(""),
  emergency_contact_relationship: z.string().default(""),
  emergency_contact_number: z.string().default(""),

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
  
  // Step 5 Conditional validation — only the highest level row is required
  const highestLevel = data.highest_educational_attainment
  data.education_details.forEach((edu, idx) => {
    const isHighestRow = edu.level === highestLevel
    if (isHighestRow) {
      if (!edu.school_name || edu.school_name.trim() === "") {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["education_details", idx, "school_name"], message: "School name is required for your highest attainment" })
      }
      if (!edu.year_started || edu.year_started.trim() === "") {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["education_details", idx, "year_started"], message: "Year started is required for your highest attainment" })
      }
      if (!edu.is_currently_enrolled && (!edu.year_graduated || edu.year_graduated.trim() === "")) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["education_details", idx, "year_graduated"], message: "Year graduated is required (or mark as currently enrolled)" })
      }
    } else {
      if (!edu.is_currently_enrolled && edu.year_started && !edu.year_graduated) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["education_details", idx, "year_graduated"], message: "Year graduated required if not currently enrolled" })
      }
    }
  })
})

const STEPS = [
  { id: 1, title: "Personal" },
  { id: 2, title: "Address" },
  { id: 3, title: "Status" },
  { id: 4, title: "Family" },
  { id: 5, title: "Education" },
  { id: 6, title: "Commitment" },
  { id: 7, title: "Review" },
]

type Ministry = { id: string; name: string; for_everyone?: boolean; parent_id?: string | null }
type OfferingCategory = { id: string; name: string; is_monthly: boolean; month: number | null }
type BaseMember = { id: string; first_name: string; last_name: string }

export function MemberForm({ initialData, ministries = [], offeringCategories = [], allMembers = [] }: { initialData?: any; ministries?: Ministry[]; offeringCategories?: OfferingCategory[]; allMembers?: BaseMember[] }) {
  const [step, setStep] = useState(1)
  
  const form = useForm({
    resolver: zodResolver(memberSchema),
    mode: "onChange",
    defaultValues: {
      first_name: initialData?.first_name || "",
      middle_name: initialData?.middle_name || "",
      last_name: initialData?.last_name || "",
      birth_date: initialData?.birth_date || "",
      gender: initialData?.gender || "",
      contact_number: initialData?.contact_number || "",
      
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

      employment_status: initialData?.employment_status || "None",
      student_school: initialData?.student_school || "",
      student_year_level: initialData?.student_year_level || "",
      student_course: initialData?.student_course || "",
      company: initialData?.company || "",
      position: initialData?.position || "",
      father_name: initialData?.father_name || "",
      father_occupation: initialData?.father_occupation || "",
      father_contact_number: initialData?.father_contact_number || "",
      mother_name: initialData?.mother_name || "",
      mother_occupation: initialData?.mother_occupation || "",
      mother_contact_number: initialData?.mother_contact_number || "",
      parents_civil_status: initialData?.parents_civil_status || "",
      siblings: initialData?.siblings || [],
      emergency_contact_name: initialData?.emergency_contact_name || "",
      emergency_contact_relationship: initialData?.emergency_contact_relationship || "",
      emergency_contact_number: initialData?.emergency_contact_number || "",
      highest_educational_attainment: initialData?.highest_educational_attainment || "",
      education_details: initialData?.education_details || [{ level: "Elementary", school_name: "", year_started: "", year_graduated: "", is_currently_enrolled: false }],
      awards_honors: initialData?.awards_honors || "",
      ministries: initialData?.ministries || [],
      marital_status: initialData?.marital_status || "Single",
      is_spouse_cbt_member: !!initialData?.spouse_member_id,
      spouse_name: initialData?.spouse_name || "",
      spouse_member_id: initialData?.spouse_member_id || "",
      spouse_occupation: initialData?.spouse_occupation || "",
      anniversary_date: initialData?.anniversary_date || "",
      date_saved: initialData?.date_saved || "",
      membership_date: initialData?.membership_date || new Date().toISOString().split("T")[0],
      baptism_date: initialData?.baptism_date || "",
      baptized_by: initialData?.baptized_by || "",
      witness_by: initialData?.witness_by || "",
      place_of_baptism: initialData?.place_of_baptism || "",
    }
  })

  const draftLoaded = React.useRef(false)

  // Auto-Save Draft (Load on mount)
  React.useEffect(() => {
    if (!initialData && !draftLoaded.current) {
      const savedDraft = localStorage.getItem("cbt_new_member_draft")
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft)
          form.reset(parsed)
          draftLoaded.current = true
          // Use setTimeout to ensure toast fires after mount
          setTimeout(() => toast.info("Unsaved draft recovered successfully.", { icon: "📝" }), 500)
        } catch (e) {
          console.error("Failed to parse draft", e)
        }
      }
    }
  }, [initialData, form])

  // Auto-Save Draft (Save on change)
  React.useEffect(() => {
    if (!initialData) {
      const subscription = form.watch((value) => {
        localStorage.setItem("cbt_new_member_draft", JSON.stringify(value))
      })
      return () => subscription.unsubscribe()
    }
  }, [initialData, form.watch])

  const { fields: siblingFields, append: appendSibling, remove: removeSibling } = useFieldArray({ control: form.control, name: "siblings" })
  const { fields: eduFields } = useFieldArray({ control: form.control, name: "education_details" })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (values: z.infer<typeof memberSchema>) => {
    setIsSubmitting(true)
    try {
      const payload = JSON.stringify({ id: initialData?.id, ...values })
      if (initialData) {
        await updateMember(payload)
        toast.success("Member profile updated successfully!")
      } else {
        await createMember(payload)
        toast.success("New member record created successfully!")
        localStorage.removeItem("cbt_new_member_draft")
      }
    } catch (e: any) {
      if (isRedirectError(e)) {
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
      form.setValue("education_details", newFields as any, { shouldValidate: step === 5 })
    }
  }, [highestAttainment, form, step])

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
    let fieldsToValidate: any[] = []
    if (step === 1) fieldsToValidate = ["first_name", "last_name", "birth_date", "gender", "contact_number"]
    if (step === 2) fieldsToValidate = []
    if (step === 3) fieldsToValidate = ["employment_status", "student_school", "student_year_level", "student_course", "company", "position"]
    if (step === 4) fieldsToValidate = ["father_name", "father_occupation", "father_contact_number", "mother_name", "mother_occupation", "mother_contact_number", "parents_civil_status", "siblings", "emergency_contact_name", "emergency_contact_relationship", "emergency_contact_number"]
    if (step === 5) fieldsToValidate = ["highest_educational_attainment", "education_details"]

    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate as any)
      if (isValid) {
        // Only allow jumping up to step + 1 to prevent skipping steps in create mode
        setStep(Math.min(step + 1, targetStepId))
      }
    } else {
      setStep(Math.min(step + 1, targetStepId))
    }
  }

  const validateStep = async () => {
    let fieldsToValidate: any[] = []
    if (step === 1) fieldsToValidate = ["first_name", "last_name", "birth_date", "gender", "contact_number"]
    if (step === 2) fieldsToValidate = [] // Address step
    if (step === 3) fieldsToValidate = ["employment_status", "student_school", "student_year_level", "student_course", "company", "position"]
    if (step === 4) fieldsToValidate = ["father_name", "father_occupation", "father_contact_number", "mother_name", "mother_occupation", "mother_contact_number", "parents_civil_status", "siblings", "emergency_contact_name", "emergency_contact_relationship", "emergency_contact_number"]
    if (step === 5) fieldsToValidate = ["highest_educational_attainment", "education_details"]
    
    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate as any)
      if (isValid) setStep(s => Math.min(STEPS.length, s + 1))
    } else {
      setStep(s => Math.min(STEPS.length, s + 1))
    }
  }

  const R = () => <span className="text-destructive ml-1">*</span>

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
    <div className="bg-card rounded-xl border shadow-sm p-4 md:p-10 w-full mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-muted/80">
            <Link href={initialData ? `/members/${initialData.id}` : "/members"}>
              <ChevronLeft className="h-6 w-6" />
            </Link>
          </Button>
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
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="h-11 px-6 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Save Changes</span>
          </Button>
        )}
      </div>

      {/* Sticky Top Stepper */}
      <div className="sticky top-0 bg-card z-10 py-4 border-b border-border mb-8 flex flex-wrap items-center justify-between gap-4 md:gap-8 px-2">
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
                "flex items-center gap-2 group transition-all duration-200 outline-none text-left rounded-lg p-1",
                (initialData || s.id <= step + 1) ? "cursor-pointer" : "cursor-not-allowed opacity-50"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all group-hover:scale-105 duration-200",
                isActive ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" : 
                isCompleted ? "bg-primary/80 text-primary-foreground group-hover:bg-primary" : 
                "bg-muted-foreground/20 text-muted-foreground group-hover:bg-muted-foreground/30"
              )}>
                {isCompleted ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <span className={cn(
                "text-sm font-medium hidden sm:block transition-colors duration-200",
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
        onSubmit={form.handleSubmit(onSubmit)} 
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const target = e.target as HTMLElement
            if (target.tagName === "TEXTAREA") return

            e.preventDefault()
            if (step < STEPS.length) {
              validateStep()
            } else {
              form.handleSubmit(onSubmit)()
            }
          }
        }}
        className="space-y-6"
      >
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
                <Label className="text-[13px] text-muted-foreground">Last Name<R/></Label>
                <Input {...form.register("last_name")} className="h-12 bg-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0" />
                {form.formState.errors.last_name && <p className="text-sm text-destructive">{form.formState.errors.last_name.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] text-muted-foreground">Date of Birth<R/></Label>
                <div className="relative flex items-center">
                  <Input 
                    type="date" 
                    {...form.register("birth_date")} 
                    className={cn(
                      "h-12 w-full bg-transparent [color-scheme:dark] focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0",
                      "[&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3",
                      !form.watch("birth_date") && "text-muted-foreground"
                    )} 
                  />
                </div>
                {form.formState.errors.birth_date && <p className="text-sm text-destructive">{form.formState.errors.birth_date.message}</p>}
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

              <div className="grid gap-2 md:col-span-2">
                <Label className="text-[13px] text-muted-foreground">Contact Number<R/></Label>
                <Input {...form.register("contact_number")} className="h-12 bg-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0" placeholder="09XX XXX XXXX" />
                {form.formState.errors.contact_number && <p className="text-sm text-destructive">{form.formState.errors.contact_number.message}</p>}
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
                    <option value="Separated" className="bg-card text-foreground">Separated / Divorced</option>
                    <option value="Annulled" className="bg-card text-foreground">Annulled</option>
                  </select>
                  <ChevronDown className="absolute right-3 h-4 w-4 text-muted-foreground opacity-50 pointer-events-none" />
                </div>
              </div>

              {form.watch("marital_status") === "Married" && (
                <>
                  <div className="grid gap-2 md:col-span-1">
                    <Label className="text-[13px] text-muted-foreground">Wedding Date / Anniversary</Label>
                    <Input type="date" {...form.register("anniversary_date")} className="h-12 bg-transparent" />
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
                        Link to an existing member profile?
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
                                  <span className="text-muted-foreground text-xs">Uncheck "Link to existing member" to enter their name manually for now.</span>
                                </CommandEmpty>
                                <CommandGroup>
                                  {allMembers.filter(m => m.id !== initialData?.id).map((m) => (
                                    <CommandItem
                                      key={m.id}
                                      value={`${m.first_name} ${m.last_name}`}
                                      onSelect={() => {
                                        form.setValue("spouse_member_id", m.id, { shouldValidate: true })
                                        form.setValue("spouse_name", `${m.first_name} ${m.last_name}`)
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
              
              <div className="grid gap-2">
                <Label className="text-[13px] text-muted-foreground">Membership Date (Joined CBT)</Label>
                <Input type="date" {...form.register("membership_date")} className="h-12 bg-transparent" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] text-muted-foreground">Date Saved (Salvation)</Label>
                <Input type="date" {...form.register("date_saved")} className="h-12 bg-transparent" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] text-muted-foreground">Baptism Date</Label>
                <Input type="date" {...form.register("baptism_date")} className="h-12 bg-transparent" />
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
                      form.watch("place_of_baptism") === "CBT (Mother Church)" || 
                      form.watch("place_of_baptism") === "CBT"
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        form.setValue("place_of_baptism", "CBT (Mother Church)", { shouldValidate: true, shouldDirty: true })
                      } else {
                        form.setValue("place_of_baptism", "", { shouldValidate: true, shouldDirty: true })
                      }
                    }}
                    className="h-4 w-4 rounded border-input bg-transparent text-primary focus:ring-primary cursor-pointer accent-primary"
                  />
                  <label htmlFor="sameAsMotherChurch" className="text-xs text-muted-foreground cursor-pointer select-none font-medium flex items-center gap-1.5 hover:text-foreground transition-colors">
                    <Church className="h-3.5 w-3.5 text-primary" />
                    Baptized at Mother Church (CBT)
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

        {/* STEP 3: EMPLOYMENT & ACADEMIC STATUS */}
        {step === 3 && (
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-xl border bg-muted/20">
                <div className="grid gap-2">
                  <Label className="text-[13px] text-muted-foreground">School / University</Label>
                  <Input {...form.register("student_school")} className="h-12 bg-transparent" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[13px] text-muted-foreground">Year Level</Label>
                  <Input {...form.register("student_year_level")} className="h-12 bg-transparent" placeholder="e.g. 3rd Year" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[13px] text-muted-foreground">Course / Track</Label>
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

        {/* STEP 4: FAMILY & EMERGENCY CONTACT */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-8">
            <h3 className="text-xl font-semibold border-b pb-2">Family & Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl border space-y-4">
                <h4 className="font-semibold text-primary">Father's Info</h4>
                <Input {...form.register("father_name")} placeholder="Father's Name" className="h-11 bg-transparent" />
                <Input {...form.register("father_occupation")} placeholder="Father's Occupation" className="h-11 bg-transparent" />
                <Input {...form.register("father_contact_number")} placeholder="Father's Contact Number" className="h-11 bg-transparent" />
              </div>
              <div className="p-4 rounded-xl border space-y-4">
                <h4 className="font-semibold text-primary">Mother's Info</h4>
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
                <Button type="button" variant="outline" size="sm" onClick={() => appendSibling({ name: "", age: "", relationship: "Sibling" })} className="gap-1.5">
                  <Plus className="h-4 w-4" /> Add Sibling
                </Button>
              </div>
              {siblingFields.map((field, index) => (
                <div key={field.id} className="flex gap-3 items-center">
                  <Input {...form.register(`siblings.${index}.name`)} placeholder="Sibling Name" className="h-11 bg-transparent" />
                  <Input {...form.register(`siblings.${index}.age`)} placeholder="Age" className="h-11 w-24 bg-transparent" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeSibling(index)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Emergency Contact */}
            <div className="p-4 rounded-xl border bg-amber-500/5 border-amber-500/20 space-y-4">
              <h4 className="font-semibold text-amber-600 dark:text-amber-400">Emergency Contact Person</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input {...form.register("emergency_contact_name")} placeholder="Name" className="h-11 bg-transparent" />
                <Input {...form.register("emergency_contact_relationship")} placeholder="Relationship" className="h-11 bg-transparent" />
                <Input {...form.register("emergency_contact_number")} placeholder="Mobile Number" className="h-11 bg-transparent" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: EDUCATION BACKGROUND */}
        {step === 5 && (
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
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs text-muted-foreground">Year Started</Label>
                        <Input {...form.register(`education_details.${index}.year_started`)} placeholder="e.g. 2015" className="h-11 bg-transparent" />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs text-muted-foreground">Year Graduated</Label>
                        <Input {...form.register(`education_details.${index}.year_graduated`)} disabled={isEnrolled} placeholder={isEnrolled ? "Enrolled" : "e.g. 2019"} className="h-11 bg-transparent" />
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <input type="checkbox" id={`enrolled-${index}`} {...form.register(`education_details.${index}.is_currently_enrolled`)} className="rounded" />
                        <label htmlFor={`enrolled-${index}`} className="text-xs cursor-pointer select-none">Currently Enrolled</label>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 6: COMMITMENT & MINISTRIES */}
        {step === 6 && (() => {
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
        {step === 7 && (() => {
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
                      <span className="text-muted-foreground block">Status</span>
                      <span className="font-semibold">{empStatus || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Highest Attainment</span>
                      <span className="font-semibold">{highestEdu || "—"}</span>
                    </div>
                    {empStatus === "Student" && (
                      <div className="col-span-2 space-y-1 pt-1 border-t">
                        <p><span className="text-muted-foreground">School:</span> {studentSchool || "—"}</p>
                        <p><span className="text-muted-foreground">Year / Course:</span> {studentYear} {studentCourse}</p>
                      </div>
                    )}
                    {empStatus === "Employed" && (
                      <div className="col-span-2 space-y-1 pt-1 border-t">
                        <p><span className="text-muted-foreground">Company:</span> {company || "—"}</p>
                        <p><span className="text-muted-foreground">Position:</span> {position || "—"}</p>
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

        {/* BOTTOM NAVIGATION BUTTONS */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t mt-8">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="h-11 px-6"
          >
            Back
          </Button>

          <div className="flex items-center gap-3">
            {initialData && step < STEPS.length && (
              <Button 
                type="button"
                variant="outline"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="h-11 px-5 gap-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>Save Changes</span>
              </Button>
            )}

            {step < STEPS.length ? (
              <Button 
                type="button" 
                data-next-btn="true"
                onClick={validateStep}
                className="h-11 px-6 gap-2"
              >
                Next Step
              </Button>
            ) : (
              <Button 
                type="submit" 
                data-next-btn="true"
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
