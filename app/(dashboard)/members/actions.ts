"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function createMember(payloadStr: string) {
  const supabase = await createClient()
  const data = JSON.parse(payloadStr)

  const { data: member, error } = await supabase.from("members").insert({
    // Step 1: Personal
    first_name: data.first_name,
    last_name: data.last_name,
    birth_date: data.birth_date,
    sex: data.gender,
    contact_number: data.contact_number,
    house_number: data.address, // Mapping address to existing fields or a new one, we'll map to street for simplicity
    street: data.address,
    
    // Step 2: Status
    employment_status: data.employment_status,
    student_school: data.student_school,
    student_year_level: data.student_year_level,
    student_course: data.student_course,
    company: data.company,
    position: data.position,
    
    // Step 3: Family
    father_name: data.father_name,
    father_occupation: data.father_occupation,
    father_contact_number: data.father_contact_number,
    mother_name: data.mother_name,
    mother_occupation: data.mother_occupation,
    mother_contact_number: data.mother_contact_number,
    parents_civil_status: data.parents_civil_status,
    siblings: data.siblings,
    emergency_contact_name: data.emergency_contact_name,
    emergency_contact_relationship: data.emergency_contact_relationship,
    emergency_contact_number: data.emergency_contact_number,
    
    // Step 4: Education
    highest_educational_attainment: data.highest_educational_attainment,
    education_details: data.education_details,
    awards_honors: data.awards_honors,
  }).select().single()

  if (error) {
    console.error("Error creating member:", error)
    throw new Error("Failed to create member")
  }

  revalidatePath("/members")
  redirect(`/members/${member.id}`)
}

export async function updateMember(payloadStr: string) {
  const supabase = await createClient()
  const data = JSON.parse(payloadStr)
  const id = data.id

  const { error } = await supabase.from("members").update({
    // Step 1: Personal
    first_name: data.first_name,
    last_name: data.last_name,
    birth_date: data.birth_date,
    sex: data.gender,
    contact_number: data.contact_number,
    street: data.address,
    
    // Step 2: Status
    employment_status: data.employment_status,
    student_school: data.student_school,
    student_year_level: data.student_year_level,
    student_course: data.student_course,
    company: data.company,
    position: data.position,
    
    // Step 3: Family
    father_name: data.father_name,
    father_occupation: data.father_occupation,
    father_contact_number: data.father_contact_number,
    mother_name: data.mother_name,
    mother_occupation: data.mother_occupation,
    mother_contact_number: data.mother_contact_number,
    parents_civil_status: data.parents_civil_status,
    siblings: data.siblings,
    emergency_contact_name: data.emergency_contact_name,
    emergency_contact_relationship: data.emergency_contact_relationship,
    emergency_contact_number: data.emergency_contact_number,
    
    // Step 4: Education
    highest_educational_attainment: data.highest_educational_attainment,
    education_details: data.education_details,
    awards_honors: data.awards_honors,
  }).eq("id", id)

  if (error) {
    console.error("Error updating member:", error)
    throw new Error("Failed to update member")
  }

  revalidatePath("/members")
  revalidatePath(`/members/${id}`)
  redirect(`/members/${id}`)
}
