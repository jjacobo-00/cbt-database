"use client"

import React, { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createMember, updateMember } from "@/app/(dashboard)/members/actions"
import { Check, ChevronLeft, GraduationCap, Briefcase, UserX, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import Link from "next/link"

const memberSchema = z.object({
  // Step 1
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  birth_date: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  contact_number: z.string().regex(/^09\d{9}$/, "Must be a valid 11-digit Philippine mobile number starting with 09"),
  address: z.string().min(1, "Address is required"),
  
  // Step 2
  employment_status: z.enum(["Student", "Employed", "None"]),
  student_school: z.string().default(""),
  student_year_level: z.string().default(""),
  student_course: z.string().default(""),
  company: z.string().default(""),
  position: z.string().default(""),
  
  // Step 3
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

  // Step 4
  highest_educational_attainment: z.string().min(1, "Highest attainment required"),
  education_details: z.array(z.object({
    level: z.string().min(1, "Level required"),
    school_name: z.string().min(1, "School name required"),
    year_started: z.string().min(1, "Year started required"),
    year_graduated: z.string().default(""),
    is_currently_enrolled: z.boolean(),
  })).default([]),
  awards_honors: z.string().default(""),
  ministries: z.array(z.string()).default([]),
}).superRefine((data, ctx) => {
  // Step 2 Validations
  if (data.employment_status === "Employed") {
    if (!data.company) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["company"], message: "Required" })
    if (!data.position) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["position"], message: "Required" })
  }
  
  // Step 4 Conditional validation
  data.education_details.forEach((edu, idx) => {
    if (!edu.is_currently_enrolled && !edu.year_graduated) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["education_details", idx, "year_graduated"], message: "Year graduated required if not currently enrolled" })
    }
  })
})

const STEPS = [
  { id: 1, title: "Personal" },
  { id: 2, title: "Status" },
  { id: 3, title: "Family" },
  { id: 4, title: "Education" },
  { id: 5, title: "Ministries" },
  { id: 6, title: "Review" },
]

export function MemberForm({ initialData }: { initialData?: any }) {
  const [step, setStep] = useState(1)
  
  const form = useForm<z.infer<typeof memberSchema>>({
    resolver: zodResolver(memberSchema),
    mode: "onChange",
    defaultValues: {
      first_name: "", last_name: "", birth_date: "", gender: "", contact_number: "", address: "",
      employment_status: "None", student_school: "", student_year_level: "", student_course: "", company: "", position: "",
      father_name: "", father_occupation: "", father_contact_number: "",
      mother_name: "", mother_occupation: "", mother_contact_number: "", parents_civil_status: "",
      siblings: [],
      emergency_contact_name: "", emergency_contact_relationship: "", emergency_contact_number: "",
      highest_educational_attainment: "",
      education_details: [{ level: "Elementary", school_name: "", year_started: "", year_graduated: "", is_currently_enrolled: false }],
      awards_honors: "",
      ministries: [],
      ...(initialData || {})
    }
  })

  const { fields: siblingFields, append: appendSibling, remove: removeSibling } = useFieldArray({ control: form.control, name: "siblings" })
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control: form.control, name: "education_details" })

  const onSubmit = async (values: z.infer<typeof memberSchema>) => {
    const payload = JSON.stringify({ id: initialData?.id, ...values })
    if (initialData) {
      await updateMember(payload)
    } else {
      await createMember(payload)
    }
  }

  const employmentStatus = form.watch("employment_status")
  const highestAttainment = form.watch("highest_educational_attainment")

  React.useEffect(() => {
    const levelsMap: Record<string, string[]> = {
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
      form.setValue("education_details", newFields as any, { shouldValidate: step === 4 })
    }
  }, [highestAttainment, form, step])

  const validateStep = async () => {
    let fieldsToValidate: any[] = []
    if (step === 1) fieldsToValidate = ["first_name", "last_name", "birth_date", "gender", "contact_number", "address"]
    if (step === 2) fieldsToValidate = ["employment_status", "student_school", "student_year_level", "student_course", "company", "position"]
    if (step === 3) fieldsToValidate = ["father_name", "father_occupation", "father_contact_number", "mother_name", "mother_occupation", "mother_contact_number", "parents_civil_status", "siblings", "emergency_contact_name", "emergency_contact_relationship", "emergency_contact_number"]
    if (step === 4) fieldsToValidate = ["highest_educational_attainment", "education_details"]
    
    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate as any)
      if (isValid) setStep(s => Math.min(STEPS.length, s + 1))
    } else {
      setStep(s => Math.min(STEPS.length, s + 1))
    }
  }

  const R = () => <span className="text-destructive ml-1">*</span>

  return (
    <div className="bg-card rounded-xl border shadow-sm p-4 md:p-10 w-full mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-muted/80">
          <Link href="/members"><ChevronLeft className="h-6 w-6" /></Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">{initialData ? "Edit Member" : "New Member Wizard"}</h2>
      </div>

      {/* Sticky Top Stepper */}
      <div className="sticky top-0 bg-card z-10 py-4 border-b border-border mb-8 flex flex-wrap items-center justify-between gap-4 md:gap-8 px-2">
        {STEPS.map((s) => {
          const isActive = step === s.id
          const isCompleted = step > s.id
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                isActive ? "bg-primary text-primary-foreground" : 
                isCompleted ? "bg-primary/80 text-primary-foreground" : 
                "bg-muted-foreground/20 text-muted-foreground"
              )}>
                {isCompleted ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <span className={cn("text-sm font-medium hidden sm:block", isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground")}>
                {s.title}
              </span>
            </div>
          )
        })}
      </div>

      <form id="member-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        
        {/* STEP 1: PERSONAL */}
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
                <Input type="date" {...form.register("birth_date")} className="h-12 bg-transparent [color-scheme:dark] focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0" />
                {form.formState.errors.birth_date && <p className="text-sm text-destructive">{form.formState.errors.birth_date.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label className="text-[13px] text-muted-foreground">Gender<R/></Label>
                <select {...form.register("gender")} className="flex h-12 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0">
                  <option value="" className="bg-background">Select...</option>
                  <option value="Male" className="bg-background">Male</option>
                  <option value="Female" className="bg-background">Female</option>
                </select>
                {form.formState.errors.gender && <p className="text-sm text-destructive">{form.formState.errors.gender.message}</p>}
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label className="text-[13px] text-muted-foreground">Address<R/></Label>
                <textarea {...form.register("address")} className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0" placeholder="Street, Barangay, City, Province, ZIP Code" />
                {form.formState.errors.address && <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>}
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label className="text-[13px] text-muted-foreground">Contact Number<R/></Label>
                <Input {...form.register("contact_number")} className="h-12 bg-transparent focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0" placeholder="09XX XXX XXXX" />
                {form.formState.errors.contact_number && <p className="text-sm text-destructive">{form.formState.errors.contact_number.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: STATUS */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-8">
            <h3 className="text-xl font-semibold mb-6 border-b pb-2">Employment / Student Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { id: "Student", icon: GraduationCap, label: "Student", desc: "Currently enrolled" },
                { id: "Employed", icon: Briefcase, label: "Employed", desc: "Currently working" },
                { id: "None", icon: UserX, label: "None / Unemployed", desc: "Neither studying nor working" },
              ].map(opt => (
                <div 
                  key={opt.id} 
                  onClick={() => form.setValue("employment_status", opt.id as any, { shouldValidate: true })}
                  className={cn(
                    "cursor-pointer border-2 rounded-xl p-6 flex flex-col items-center text-center transition-all hover:border-primary/50",
                    employmentStatus === opt.id ? "border-primary bg-primary/5 shadow-md" : "border-border"
                  )}
                >
                  <opt.icon className={cn("w-10 h-10 mb-4", employmentStatus === opt.id ? "text-primary" : "text-muted-foreground")} />
                  <h4 className="font-bold text-lg">{opt.label}</h4>
                  <p className="text-sm text-muted-foreground mt-2">{opt.desc}</p>
                </div>
              ))}
            </div>

            {employmentStatus === "Student" && (
              <p className="text-muted-foreground italic text-sm mt-4 text-center animate-in fade-in slide-in-from-bottom-2">
                Your school details will be collected on the Education page.
              </p>
            )}

            {employmentStatus === "Employed" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid gap-2.5">
                  <Label>Company Name<R/></Label>
                  <Input {...form.register("company")} className="h-12" />
                  {form.formState.errors.company && <p className="text-sm text-destructive">{form.formState.errors.company.message}</p>}
                </div>
                <div className="grid gap-2.5">
                  <Label>Position / Role<R/></Label>
                  <Input {...form.register("position")} className="h-12" />
                  {form.formState.errors.position && <p className="text-sm text-destructive">{form.formState.errors.position.message}</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: FAMILY */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-10">
            <h3 className="text-xl font-semibold border-b pb-2">Family Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 p-6 border rounded-xl bg-muted/10">
              <h4 className="col-span-full font-bold text-primary">Parents' Details (Optional)</h4>
              <div className="grid gap-2.5"><Label>Father's Name</Label><Input {...form.register("father_name")} className="h-11" /></div>
              <div className="grid gap-2.5"><Label>Father's Occupation</Label><Input {...form.register("father_occupation")} className="h-11" /></div>
              <div className="grid gap-2.5"><Label>Father's Contact</Label><Input {...form.register("father_contact_number")} className="h-11" /></div>
              
              <div className="grid gap-2.5"><Label>Mother's Name</Label><Input {...form.register("mother_name")} className="h-11" /></div>
              <div className="grid gap-2.5"><Label>Mother's Occupation</Label><Input {...form.register("mother_occupation")} className="h-11" /></div>
              <div className="grid gap-2.5"><Label>Mother's Contact</Label><Input {...form.register("mother_contact_number")} className="h-11" /></div>
              
              <div className="grid gap-2.5 col-span-full md:col-span-1">
                <Label>Parents' Civil Status</Label>
                <select {...form.register("parents_civil_status")} className="flex h-11 w-full rounded-md border border-input bg-background text-foreground px-3 py-1">
                  <option value="" className="bg-background">Select...</option>
                  <option value="Married" className="bg-background">Married</option>
                  <option value="Separated" className="bg-background">Separated</option>
                  <option value="Widowed" className="bg-background">Widowed/Deceased</option>
                  <option value="Single" className="bg-background">Single Parent</option>
                </select>
              </div>
            </div>

            <div className="p-6 border rounded-xl bg-muted/10">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold text-primary">Siblings ({siblingFields.length})</h4>
                <Button type="button" variant="outline" size="sm" onClick={() => appendSibling({ name: "", age: "", relationship: "" })}>
                  <Plus className="w-4 h-4 mr-2" /> Add Sibling
                </Button>
              </div>
              {siblingFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
                  <div className="grid gap-2"><Label>Name</Label><Input {...form.register(`siblings.${index}.name`)} /></div>
                  <div className="grid gap-2"><Label>Age</Label><Input type="number" {...form.register(`siblings.${index}.age`)} /></div>
                  <div className="grid gap-2"><Label>Relationship</Label><Input {...form.register(`siblings.${index}.relationship`)} placeholder="Brother/Sister" /></div>
                  <Button type="button" variant="destructive" size="icon" onClick={() => removeSibling(index)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
              {siblingFields.length === 0 && <p className="text-sm text-muted-foreground italic">No siblings added.</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 p-6 border rounded-xl bg-muted/10">
              <h4 className="col-span-full font-bold text-primary">Emergency Contact (Optional)</h4>
              <div className="grid gap-2.5"><Label>Contact Name</Label><Input {...form.register("emergency_contact_name")} className="h-11" /></div>
              <div className="grid gap-2.5"><Label>Relationship</Label><Input {...form.register("emergency_contact_relationship")} className="h-11" /></div>
              <div className="grid gap-2.5"><Label>Contact Number</Label><Input {...form.register("emergency_contact_number")} className="h-11" /></div>
            </div>
          </div>
        )}

        {/* STEP 4: EDUCATION */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-10">
            <h3 className="text-xl font-semibold border-b pb-2">Education Background</h3>
            <p className="text-muted-foreground italic text-sm">Fill in your education history based on your highest attainment. All fields are required unless you are currently enrolled.</p>
            
            <div className="grid gap-2.5 max-w-md">
              <Label>Highest Educational Attainment<R/></Label>
              <select {...form.register("highest_educational_attainment")} className="flex h-12 w-full rounded-md border border-input bg-background text-foreground px-3 py-1">
                <option value="" className="bg-background">Select...</option>
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
                
                let borderColor = "border-l-gray-500"
                if (levelName === "Elementary") borderColor = "border-l-green-500"
                if (levelName === "High School") borderColor = "border-l-blue-500"
                if (levelName === "Senior High School") borderColor = "border-l-indigo-500"
                if (levelName === "Vocational") borderColor = "border-l-yellow-500"
                if (levelName === "College") borderColor = "border-l-purple-500"
                if (levelName === "Postgraduate") borderColor = "border-l-rose-500"

                return (
                  <div key={field.id} className={cn("grid grid-cols-1 md:grid-cols-12 gap-6 p-6 border rounded-xl bg-card shadow-sm relative animate-in slide-in-from-bottom-4 fade-in border-l-4", borderColor)}>
                    <div className="col-span-12">
                      <h4 className="font-bold text-lg text-primary">{levelName}</h4>
                    </div>
                    
                    <div className="col-span-12 md:col-span-6 grid gap-2">
                      <Label>School Name<R/></Label>
                      <Input {...form.register(`education_details.${index}.school_name`)} className="bg-transparent" />
                      {form.formState.errors.education_details?.[index]?.school_name && <p className="text-sm text-destructive">{form.formState.errors.education_details[index]?.school_name?.message}</p>}
                    </div>
                    
                    <div className="col-span-12 md:col-span-3 grid gap-2">
                      <Label>Year Started<R/></Label>
                      <Input type="number" {...form.register(`education_details.${index}.year_started`)} className="bg-transparent" />
                      {form.formState.errors.education_details?.[index]?.year_started && <p className="text-sm text-destructive">{form.formState.errors.education_details[index]?.year_started?.message}</p>}
                    </div>
                    
                    <div className="col-span-12 md:col-span-3 grid gap-2">
                      <Label>Year Graduated {!isEnrolled && <R/>}</Label>
                      <Input type={isEnrolled ? "text" : "number"} value={isEnrolled ? "Present" : undefined} disabled={isEnrolled} {...(isEnrolled ? {} : form.register(`education_details.${index}.year_graduated`))} className={cn("bg-transparent", isEnrolled && "font-bold text-primary")} />
                      {form.formState.errors.education_details?.[index]?.year_graduated && <p className="text-sm text-destructive">{form.formState.errors.education_details[index]?.year_graduated?.message}</p>}
                    </div>
                    
                    {isHighest && (
                      <div className="col-span-12 flex items-center gap-2 mt-2">
                        <input type="checkbox" id={`enroll_${index}`} {...form.register(`education_details.${index}.is_currently_enrolled`)} className="w-4 h-4 accent-primary" />
                        <Label htmlFor={`enroll_${index}`} className="cursor-pointer">I am currently enrolled here</Label>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="grid gap-2.5">
              <Label>Awards or Honors Received (Optional)</Label>
              <textarea {...form.register("awards_honors")} className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" placeholder="List any honors or awards..." />
            </div>
          </div>
        )}

        {/* STEP 5: MINISTRIES */}
        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-10">
            <h3 className="text-xl font-semibold border-b pb-2">Ministries</h3>
            <p className="text-muted-foreground">Select the ministries you are currently serving in or wish to join.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Placeholder for ministries checklist */}
              <div className="border rounded-xl p-6 flex items-center gap-4">
                <input type="checkbox" className="w-5 h-5" id="min_music" />
                <Label htmlFor="min_music" className="text-lg">Music Ministry</Label>
              </div>
              <div className="border rounded-xl p-6 flex items-center gap-4">
                <input type="checkbox" className="w-5 h-5" id="min_youth" />
                <Label htmlFor="min_youth" className="text-lg">Youth Ministry</Label>
              </div>
              <div className="border rounded-xl p-6 flex items-center gap-4">
                <input type="checkbox" className="w-5 h-5" id="min_kids" />
                <Label htmlFor="min_kids" className="text-lg">Kids Ministry</Label>
              </div>
              <div className="border rounded-xl p-6 flex items-center gap-4">
                <input type="checkbox" className="w-5 h-5" id="min_tech" />
                <Label htmlFor="min_tech" className="text-lg">Tech & Media Ministry</Label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: REVIEW */}
        {step === 6 && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-10">
            <h3 className="text-xl font-semibold border-b pb-2 text-primary">Summary & Review</h3>
            <p className="text-muted-foreground">Please review your information before final submission.</p>
            
            <div className="bg-muted/10 border rounded-xl p-6 space-y-4">
              <h4 className="font-bold border-b pb-2">Personal</h4>
              <p><strong>Name:</strong> {form.getValues("first_name") ?? "—"} {form.getValues("last_name") ?? "—"}</p>
              <p><strong>Status:</strong> {form.getValues("employment_status") ?? "—"}</p>
              
              <h4 className="font-bold border-b pb-2 mt-6">Family</h4>
              <p><strong>Father:</strong> {form.getValues("father_name") || "—"}</p>
              <p><strong>Mother:</strong> {form.getValues("mother_name") || "—"}</p>
              <p><strong>Siblings:</strong> {(form.getValues("siblings") ?? []).length} recorded</p>
              
              <h4 className="font-bold border-b pb-2 mt-6">Education</h4>
              <p><strong>Highest Attainment:</strong> {form.getValues("highest_educational_attainment") ?? "—"}</p>
              <p><strong>History:</strong> {(form.getValues("education_details") ?? []).length} schools recorded</p>
            </div>
            <p className="text-sm text-center italic text-muted-foreground">Click Submit to save this member to the database.</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-8 border-t border-border mt-12">
          <Button 
            type="button"
            variant="outline" 
            className="h-12 px-8 rounded-md font-medium"
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
          >
            Back
          </Button>
          
          {step < STEPS.length ? (
            <Button 
              type="button" 
              className="h-12 px-10 bg-primary text-primary-foreground rounded-md font-medium" 
              onClick={validateStep}
            >
              Next
            </Button>
          ) : (
            <Button 
              type="submit" 
              form="member-form" 
              className="h-12 px-10 bg-green-600 hover:bg-green-700 text-white rounded-md font-bold text-lg shadow-lg"
            >
              Submit Form
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
