"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createMember } from "@/app/(dashboard)/members/actions"

const memberSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  contact_number: z.string().optional(),
  city: z.string().optional(),
  occupation: z.string().optional(),
})

export function MemberForm() {
  const [step, setStep] = useState(1)
  
  const form = useForm<z.infer<typeof memberSchema>>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      contact_number: "",
      city: "",
      occupation: "",
    }
  })

  const onSubmit = async (values: z.infer<typeof memberSchema>) => {
    const formData = new FormData()
    formData.append("first_name", values.first_name)
    formData.append("last_name", values.last_name)
    formData.append("contact_number", values.contact_number || "")
    formData.append("city", values.city || "")
    formData.append("occupation", values.occupation || "")
    
    await createMember(formData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Member Information (Step {step} of 2)</CardTitle>
      </CardHeader>
      <CardContent>
        <form id="member-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input id="first_name" {...form.register("first_name")} />
                {form.formState.errors.first_name && (
                  <p className="text-sm text-destructive">{form.formState.errors.first_name.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input id="last_name" {...form.register("last_name")} />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="contact_number">Contact Number</Label>
                <Input id="contact_number" {...form.register("contact_number")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...form.register("city")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input id="occupation" {...form.register("occupation")} />
              </div>
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          Previous
        </Button>
        {step < 2 ? (
          <Button onClick={() => setStep(s => Math.min(2, s + 1))}>
            Next
          </Button>
        ) : (
          <Button type="submit" form="member-form">
            Submit
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
