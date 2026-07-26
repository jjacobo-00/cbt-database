"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { members, ministries, member_ministries, commitments, commitment_ministries, commitment_offerings } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function createMember(payloadStr: string) {
  const data = JSON.parse(payloadStr)

  const [member] = await db.insert(members).values({
    // Step 1: Personal
    first_name: data.first_name,
    last_name: data.last_name,
    birth_date: data.birth_date,
    sex: data.gender,
    contact_number: data.contact_number,
    house_number: data.address,
    street: data.address,
    
    // Baptism Info
    baptism_date: data.baptism_date,
    baptized_by: data.baptized_by,
    witness_by: data.witness_by,
    place_of_baptism: data.place_of_baptism,
    
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
  }).returning()

  if (!member) {
    throw new Error("Failed to create member")
  }

  // Auto-enroll new member in all "for everyone" ministries
  const forEveryoneMinistries = await db
    .select({ id: ministries.id })
    .from(ministries)
    .where(eq(ministries.for_everyone, true))

  if (forEveryoneMinistries.length > 0) {
    await db.insert(member_ministries).values(
      forEveryoneMinistries.map(m => ({
        member_id: member.id,
        ministry_id: m.id,
      }))
    ).onConflictDoNothing()
  }

  // Create commitment for current year
  const currentYear = new Date().getFullYear()
  const selectedMinistries: string[] = data.ministries || []
  const selectedOfferings: string[] = data.offerings || []

  // Merge selected ministries with for_everyone ministries
  const allMinistryIds = [...new Set([...selectedMinistries, ...forEveryoneMinistries.map(m => m.id)])]

  const [commitment] = await db.insert(commitments).values({
    member_id: member.id,
    year: currentYear,
  }).returning()

  if (commitment && allMinistryIds.length > 0) {
    await db.insert(commitment_ministries).values(
      allMinistryIds.map(mid => ({ commitment_id: commitment.id, ministry_id: mid }))
    )
  }

  if (commitment && selectedOfferings.length > 0) {
    await db.insert(commitment_offerings).values(
      selectedOfferings.map(oid => ({ commitment_id: commitment.id, offering_category_id: oid }))
    )
  }

  revalidatePath("/members")
  revalidatePath("/commitments")
  redirect(`/members/${member.id}`)
}

export async function updateMember(payloadStr: string) {
  const data = JSON.parse(payloadStr)
  const id = data.id

  await db.update(members).set({
    // Step 1: Personal
    first_name: data.first_name,
    last_name: data.last_name,
    birth_date: data.birth_date,
    sex: data.gender,
    contact_number: data.contact_number,
    street: data.address,
    
    // Baptism Info
    baptism_date: data.baptism_date,
    baptized_by: data.baptized_by,
    witness_by: data.witness_by,
    place_of_baptism: data.place_of_baptism,
    
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
  }).where(eq(members.id, id))

  revalidatePath("/members")
  revalidatePath(`/members/${id}`)
  redirect(`/members/${id}`)
}
