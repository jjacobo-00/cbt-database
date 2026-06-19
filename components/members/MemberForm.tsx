"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createMember, updateMember } from "@/app/(dashboard)/members/actions"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import Link from "next/link"

const memberSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  contact_number: z.string().optional(),
  city: z.string().optional(),
  occupation: z.string().optional(),
})

const STEPS = [
  { id: 1, title: "Personal Information" },
  { id: 2, title: "Job Information" },
  { id: 3, title: "Family Information" },
  { id: 4, title: "Education Details" },
]

export function MemberForm({ initialData }: { initialData?: any }) {
  const [step, setStep] = useState(1)
  
  const form = useForm<z.infer<typeof memberSchema>>({
    resolver: zodResolver(memberSchema),
    defaultValues: initialData || {
      first_name: "",
      last_name: "",
      contact_number: "",
      city: "",
      occupation: "",
    }
  })

  const onSubmit = async (values: z.infer<typeof memberSchema>) => {
    // Only process actual form submission if we are on the final step or if validation passes
    const formData = new FormData()
    if (initialData) formData.append("id", initialData.id)
    formData.append("first_name", values.first_name)
    formData.append("last_name", values.last_name)
    formData.append("contact_number", values.contact_number || "")
    formData.append("city", values.city || "")
    formData.append("occupation", values.occupation || "")
    
    if (initialData) {
      await updateMember(formData)
    } else {
      await createMember(formData)
    }
  }

  return (
    <div className="bg-card rounded-xl border shadow-sm p-8 md:p-12 w-full mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-muted/80">
          <Link href="/members"><ChevronLeft className="h-6 w-6" /></Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">{initialData ? "Edit Member Form" : "Member Data Form"}</h2>
      </div>

      {/* Flat Visual Stepper */}
      <div className="flex flex-wrap items-center gap-6 md:gap-12 border-b border-border pb-8 mb-10">
        {STEPS.map((s, index) => {
          const isActive = step === s.id
          const isCompleted = step > s.id
          
          return (
            <div key={s.id} className="flex items-center gap-3">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                isActive ? "bg-[#0ea5e9] text-white" : // using a nice blue/green to match the vibe
                isCompleted ? "bg-[#0ea5e9]/80 text-white" : 
                "bg-muted-foreground/20 text-muted-foreground"
              )}>
                {s.id}
              </div>
              <span className={cn(
                "text-sm font-medium",
                isActive ? "text-[#0ea5e9]" : 
                isCompleted ? "text-foreground" : 
                "text-muted-foreground"
              )}>
                {s.title}
              </span>
            </div>
          )
        })}
      </div>

      {/* Form Content */}
      <form id="member-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        <div className="animate-in fade-in slide-in-from-left-2 duration-300">
          
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8">
              <div className="grid gap-2.5">
                <Label htmlFor="first_name" className="text-sm font-medium text-foreground/80">First Name</Label>
                <Input id="first_name" {...form.register("first_name")} className="h-12 bg-transparent text-base" placeholder="Your first name" />
                {form.formState.errors.first_name && (
                  <p className="text-sm text-destructive">{form.formState.errors.first_name.message}</p>
                )}
              </div>
              <div className="grid gap-2.5">
                <Label htmlFor="last_name" className="text-sm font-medium text-foreground/80">Last Name</Label>
                <Input id="last_name" {...form.register("last_name")} className="h-12 bg-transparent text-base" placeholder="Your last name" />
                {form.formState.errors.last_name && (
                  <p className="text-sm text-destructive">{form.formState.errors.last_name.message}</p>
                )}
              </div>
              <div className="grid gap-2.5">
                <Label htmlFor="mock_dob" className="text-sm font-medium text-foreground/80">Date of Birth</Label>
                <Input id="mock_dob" type="date" className="h-12 bg-transparent text-base" />
              </div>

              {/* Full width field */}
              <div className="grid gap-2.5 md:col-span-3">
                <Label htmlFor="mock_address" className="text-sm font-medium text-foreground/80">Registered Address</Label>
                <Input id="mock_address" className="h-12 bg-transparent text-base" placeholder="Your full address" />
              </div>

              <div className="grid gap-2.5">
                <Label htmlFor="mock_country" className="text-sm font-medium text-foreground/80">Country</Label>
                <Input id="mock_country" className="h-12 bg-transparent text-base" placeholder="Country" />
              </div>
              <div className="grid gap-2.5">
                <Label htmlFor="mock_postcode" className="text-sm font-medium text-foreground/80">Postcode</Label>
                <Input id="mock_postcode" className="h-12 bg-transparent text-base" placeholder="Enter code" />
              </div>
              <div className="grid gap-2.5">
                <Label htmlFor="contact_number" className="text-sm font-medium text-foreground/80">Mobile Phone</Label>
                <Input id="contact_number" {...form.register("contact_number")} className="h-12 bg-transparent text-base" placeholder="Phone" />
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8">
              <div className="grid gap-2.5">
                <Label htmlFor="occupation" className="text-sm font-medium text-foreground/80">Occupation</Label>
                <Input id="occupation" {...form.register("occupation")} className="h-12 bg-transparent text-base" placeholder="Your occupation" />
              </div>
              <div className="grid gap-2.5">
                <Label htmlFor="city" className="text-sm font-medium text-foreground/80">City</Label>
                <Input id="city" {...form.register("city")} className="h-12 bg-transparent text-base" placeholder="City" />
              </div>
              <div className="grid gap-2.5">
                <Label htmlFor="mock_company" className="text-sm font-medium text-foreground/80">Company</Label>
                <Input id="mock_company" className="h-12 bg-transparent text-base" placeholder="Company name" />
              </div>
            </div>
          )}

          {step > 2 && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <p className="text-muted-foreground">This section is currently under development.</p>
              <p className="text-sm text-muted-foreground/70">You can skip it for now and proceed to submit the form.</p>
            </div>
          )}
          
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end items-center mt-12 gap-4">
          <Button 
            type="button"
            variant="outline" 
            className="h-11 px-8 rounded font-medium bg-muted text-muted-foreground border-transparent hover:bg-muted/80 hover:text-foreground"
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
          >
            Back
          </Button>
          
          {step < STEPS.length ? (
            <Button type="button" className="h-11 px-10 bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded font-medium" onClick={() => setStep(s => Math.min(STEPS.length, s + 1))}>
              Next
            </Button>
          ) : (
            <Button type="submit" form="member-form" className="h-11 px-10 bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded font-medium">
              Submit
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
