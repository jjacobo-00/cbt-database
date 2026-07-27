"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { members, ministries, member_ministries, commitments, commitment_ministries, commitment_offerings, invitation_links, children } from "@/db/schema"
import crypto from "crypto"
import { eq, and, gt, desc, isNull, inArray, notInArray } from "drizzle-orm"

export async function coreCreateMember(payloadStr: string) {
  const data = JSON.parse(payloadStr)

  const [member] = await db.insert(members).values({
    // Step 1: Personal
    first_name: data.first_name,
    middle_name: data.middle_name || "",
    last_name: data.last_name,
    suffix: data.suffix || "",
    birth_date: data.birth_date || null,
    birth_place: data.birth_place || "",
    sex: data.gender,
    contact_number: data.contact_number,
    email: data.email || "",
    marital_status: data.marital_status || "Single",
    widowed_date: data.widowed_date || null,
    spouse_name: data.spouse_name || "",
    spouse_member_id: data.spouse_member_id || null,
    spouse_occupation: data.spouse_occupation || "",
    anniversary_date: data.anniversary_date || null,
    house_number: data.house_number || "",
    unit_number: data.unit_number || "",
    street: data.street || data.address || "",
    barangay: data.barangay || "",
    city: data.city || "",
    province: data.province || "",
    zip_code: data.zip_code || "",
    country: data.country || "Philippines",
    
    // Permanent Address
    is_perm_same_as_current: data.is_perm_same_as_current ?? true,
    perm_house_number: data.is_perm_same_as_current ? (data.house_number || "") : (data.perm_house_number || ""),
    perm_unit_number: data.is_perm_same_as_current ? (data.unit_number || "") : (data.perm_unit_number || ""),
    perm_street: data.is_perm_same_as_current ? (data.street || data.address || "") : (data.perm_street || ""),
    perm_barangay: data.is_perm_same_as_current ? (data.barangay || "") : (data.perm_barangay || ""),
    perm_city: data.is_perm_same_as_current ? (data.city || "") : (data.perm_city || ""),
    perm_province: data.is_perm_same_as_current ? (data.province || "") : (data.perm_province || ""),
    perm_zip_code: data.is_perm_same_as_current ? (data.zip_code || "") : (data.perm_zip_code || ""),
    perm_country: data.is_perm_same_as_current ? (data.country || "Philippines") : (data.perm_country || "Philippines"),
    
    // Spiritual & Church Info
    date_saved: data.date_saved || null,
    membership_date: data.membership_date || null,
    baptism_date: data.baptism_date || null,
    date_baptized: data.date_baptized || data.baptism_date || null,
    baptized_by: data.baptized_by || "",
    witness_by: data.witness_by || "",
    place_of_baptism: data.place_of_baptism || "",
    years_in_church: (() => {
      const targetDate = data.membership_date || data.date_saved || data.baptism_date
      if (!targetDate) return null
      const d = new Date(targetDate)
      if (isNaN(d.getTime())) return null
      const today = new Date()
      let y = today.getFullYear() - d.getFullYear()
      const m = today.getMonth() - d.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < d.getDate())) y--
      return Math.max(0, y)
    })(),
    
    // Step 2: Status & Occupation
    employment_status: data.employment_status,
    occupation: data.occupation || data.position || (data.employment_status === "Student" ? "Student" : data.company ? `${data.position || "Employee"} at ${data.company}` : data.employment_status !== "None" ? data.employment_status : ""),
    student_school: data.student_school,
    student_year_level: data.student_year_level,
    student_course: data.student_course,
    company: data.company,
    position: data.position,
    
    // Step 3: Family
    father_name: data.father_name,
    father_member_id: data.father_member_id || null,
    father_occupation: data.father_occupation,
    father_contact_number: data.father_contact_number,
    mother_name: data.mother_name,
    mother_member_id: data.mother_member_id || null,
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

  // Merge selected ministries with for_everyone ministries
  const selectedMinistries: string[] = data.ministries || []
  const selectedOfferings: string[] = data.offerings || []
  const allMinistryIds = [...new Set([...selectedMinistries, ...forEveryoneMinistries.map(m => m.id)])]

  if (allMinistryIds.length > 0) {
    await db.insert(member_ministries).values(
      allMinistryIds.map(mid => ({
        member_id: member.id,
        ministry_id: mid,
      }))
    ).onConflictDoNothing()
  }

  // Create commitment for current year
  const currentYear = new Date().getFullYear()

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

  // TWO-WAY SPOUSE SYNC
  if (data.spouse_member_id) {
    // Link the new spouse (set their reference back to this newly created user)
    await db.update(members).set({
      spouse_member_id: member.id,
      spouse_name: `${member.first_name} ${member.last_name}`,
      marital_status: data.marital_status || "Married",
      anniversary_date: data.anniversary_date || null
    }).where(eq(members.id, data.spouse_member_id))
  }

  // TWO-WAY PARENT SYNC
  if (data.father_member_id) {
    // We don't automatically insert into children table for them, because Profile view will automatically see it!
  }

  // PROCESS CHILDREN
  if (data.children && Array.isArray(data.children) && data.children.length > 0) {
    const childrenToInsert = data.children.map((c: any) => ({
      member_id: member.id,
      name: c.name,
      birth_date: c.birth_date || null,
      child_member_id: c.child_member_id || null
    }))
    await db.insert(children).values(childrenToInsert)
    
    // Auto-sync to spouse if married
    if (data.spouse_member_id) {
      const spouseChildrenToInsert = childrenToInsert.map((c: any) => ({
        ...c,
        member_id: data.spouse_member_id
      }))
      await db.insert(children).values(spouseChildrenToInsert)
    }

    // TWO-WAY CHILD SYNC (Update child's parents)
    for (const c of data.children) {
      if (c.child_member_id) {
        if (data.gender === "Male") {
          await db.update(members).set({ father_member_id: member.id, father_name: `${member.first_name} ${member.last_name}` }).where(eq(members.id, c.child_member_id))
        } else {
          await db.update(members).set({ mother_member_id: member.id, mother_name: `${member.first_name} ${member.last_name}` }).where(eq(members.id, c.child_member_id))
        }
      }
    }
  }

  return member.id
}

export async function createMember(payloadStr: string) {
  const memberId = await coreCreateMember(payloadStr)
  revalidatePath("/members")
  revalidatePath("/commitments")
  redirect(`/members/${memberId}`)
}

export async function coreUpdateMember(payloadStr: string) {
  const data = JSON.parse(payloadStr)
  const id = data.id

  const [existingMember] = await db.select({ spouse_member_id: members.spouse_member_id }).from(members).where(eq(members.id, id))

  await db.update(members).set({
    // Step 1: Personal
    first_name: data.first_name,
    middle_name: data.middle_name || "",
    last_name: data.last_name,
    suffix: data.suffix || "",
    birth_date: data.birth_date || null,
    birth_place: data.birth_place || "",
    sex: data.gender,
    contact_number: data.contact_number,
    email: data.email || "",
    marital_status: data.marital_status || "Single",
    widowed_date: data.widowed_date || null,
    spouse_name: data.spouse_name || "",
    spouse_member_id: data.spouse_member_id || null,
    spouse_occupation: data.spouse_occupation || "",
    anniversary_date: data.anniversary_date || null,
    house_number: data.house_number || "",
    unit_number: data.unit_number || "",
    street: data.street || data.address || "",
    barangay: data.barangay || "",
    city: data.city || "",
    province: data.province || "",
    zip_code: data.zip_code || "",
    country: data.country || "Philippines",
    
    // Permanent Address
    is_perm_same_as_current: data.is_perm_same_as_current ?? true,
    perm_house_number: data.is_perm_same_as_current ? (data.house_number || "") : (data.perm_house_number || ""),
    perm_unit_number: data.is_perm_same_as_current ? (data.unit_number || "") : (data.perm_unit_number || ""),
    perm_street: data.is_perm_same_as_current ? (data.street || data.address || "") : (data.perm_street || ""),
    perm_barangay: data.is_perm_same_as_current ? (data.barangay || "") : (data.perm_barangay || ""),
    perm_city: data.is_perm_same_as_current ? (data.city || "") : (data.perm_city || ""),
    perm_province: data.is_perm_same_as_current ? (data.province || "") : (data.perm_province || ""),
    perm_zip_code: data.is_perm_same_as_current ? (data.zip_code || "") : (data.perm_zip_code || ""),
    perm_country: data.is_perm_same_as_current ? (data.country || "Philippines") : (data.perm_country || "Philippines"),
    
    // Spiritual & Church Info
    date_saved: data.date_saved || null,
    membership_date: data.membership_date || null,
    baptism_date: data.baptism_date || null,
    date_baptized: data.date_baptized || data.baptism_date || null,
    baptized_by: data.baptized_by || "",
    witness_by: data.witness_by || "",
    place_of_baptism: data.place_of_baptism || "",
    years_in_church: (() => {
      const targetDate = data.membership_date || data.date_saved || data.baptism_date
      if (!targetDate) return null
      const d = new Date(targetDate)
      if (isNaN(d.getTime())) return null
      const today = new Date()
      let y = today.getFullYear() - d.getFullYear()
      const m = today.getMonth() - d.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < d.getDate())) y--
      return Math.max(0, y)
    })(),
    
    // Step 2: Status & Occupation
    employment_status: data.employment_status,
    occupation: data.occupation || data.position || (data.employment_status === "Student" ? "Student" : data.company ? `${data.position || "Employee"} at ${data.company}` : data.employment_status !== "None" ? data.employment_status : ""),
    student_school: data.student_school,
    student_year_level: data.student_year_level,
    student_course: data.student_course,
    company: data.company,
    position: data.position,
    
    // Step 3: Family
    father_name: data.father_name,
    father_member_id: data.father_member_id || null,
    father_occupation: data.father_occupation,
    father_contact_number: data.father_contact_number,
    mother_name: data.mother_name,
    mother_member_id: data.mother_member_id || null,
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

  // Update ministries & offerings for the current year
  const currentYear = new Date().getFullYear()
  const selectedMinistries: string[] = data.ministries || []
  const selectedOfferings: string[] = data.offerings || []

  // Auto-enroll in "for everyone" ministries
  const forEveryoneMinistries = await db
    .select({ id: ministries.id })
    .from(ministries)
    .where(eq(ministries.for_everyone, true))

  const allMinistryIds = [...new Set([...selectedMinistries, ...forEveryoneMinistries.map(m => m.id)])]

  // Update member_ministries (global active ministries)
  await db.delete(member_ministries).where(eq(member_ministries.member_id, id))
  if (allMinistryIds.length > 0) {
    await db.insert(member_ministries).values(
      allMinistryIds.map(mid => ({ member_id: id, ministry_id: mid }))
    )
  }

  // Find existing commitment for the year
  const existingCommitments = await db
    .select()
    .from(commitments)
    .where(and(eq(commitments.member_id, id), eq(commitments.year, currentYear)))

  let commitmentId: string

  if (existingCommitments.length > 0) {
    commitmentId = existingCommitments[0].id
    // Clear old associations
    await db.delete(commitment_ministries).where(eq(commitment_ministries.commitment_id, commitmentId))
    await db.delete(commitment_offerings).where(eq(commitment_offerings.commitment_id, commitmentId))
  } else {
    // Create new commitment
    const [newCommitment] = await db.insert(commitments).values({
      member_id: id,
      year: currentYear,
    }).returning()
    commitmentId = newCommitment.id
  }

  // Insert new associations
  if (allMinistryIds.length > 0) {
    await db.insert(commitment_ministries).values(
      allMinistryIds.map(mid => ({ commitment_id: commitmentId, ministry_id: mid }))
    )
  }

  if (selectedOfferings.length > 0) {
    await db.insert(commitment_offerings).values(
      selectedOfferings.map(oid => ({ commitment_id: commitmentId, offering_category_id: oid }))
    )
  }

  // TWO-WAY SPOUSE SYNC
  const newSpouseId = data.spouse_member_id || null
  const oldSpouseId = existingMember?.spouse_member_id || null

  if (oldSpouseId && oldSpouseId !== newSpouseId) {
    // Unlink the old spouse (remove their reference back to this user)
    await db.update(members).set({
      spouse_member_id: null,
      spouse_name: "",
    }).where(eq(members.id, oldSpouseId))
  }

  if (newSpouseId) {
    // Link the new spouse (set their reference back to this user)
    await db.update(members).set({
      spouse_member_id: id,
      spouse_name: `${data.first_name} ${data.last_name}`,
      marital_status: data.marital_status || "Married",
      anniversary_date: data.anniversary_date || null
    }).where(eq(members.id, newSpouseId))
  }

  // PROCESS CHILDREN
  await db.delete(children).where(eq(children.member_id, id))
  if (data.children && Array.isArray(data.children) && data.children.length > 0) {
    const childrenToInsert = data.children.map((c: any) => ({
      member_id: id,
      name: c.name,
      birth_date: c.birth_date || null,
      child_member_id: c.child_member_id || null
    }))
    await db.insert(children).values(childrenToInsert)
    
    // Auto-sync to spouse if married
    if (newSpouseId) {
      await db.delete(children).where(eq(children.member_id, newSpouseId))
      const spouseChildrenToInsert = childrenToInsert.map((c: any) => ({
        ...c,
        member_id: newSpouseId
      }))
      await db.insert(children).values(spouseChildrenToInsert)
    }

    // TWO-WAY CHILD SYNC (Update child's parents)
    for (const c of data.children) {
      if (c.child_member_id) {
        if (data.gender === "Male") {
          await db.update(members).set({ father_member_id: id, father_name: `${data.first_name} ${data.last_name}` }).where(eq(members.id, c.child_member_id))
        } else {
          await db.update(members).set({ mother_member_id: id, mother_name: `${data.first_name} ${data.last_name}` }).where(eq(members.id, c.child_member_id))
        }
      }
    }
  }

  return id
}

export async function updateMember(payloadStr: string) {
  const memberId = await coreUpdateMember(payloadStr)
  revalidatePath("/members")
  revalidatePath(`/members/${memberId}`)
  redirect(`/members/${memberId}`)
}

export async function deleteMember(id: string) {
  await db.delete(members).where(eq(members.id, id))
  revalidatePath("/members")
  redirect("/members")
}

// --------------------------------------------------------------------------------------
// INVITATION LINKS (Self-Service)
// --------------------------------------------------------------------------------------

export async function generateInviteLink(memberId?: string) {
  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 mins

  await db.insert(invitation_links).values({
    token,
    member_id: memberId || null,
    expires_at: expiresAt,
    is_used: false,
  })

  // Return just the token, the client will construct the full URL based on its origin
  return token
}

export async function getActiveInvitationLinks(memberId?: string) {
  const now = new Date()
  const links = await db
    .select()
    .from(invitation_links)
    .where(
      and(
        memberId ? eq(invitation_links.member_id, memberId) : isNull(invitation_links.member_id),
        eq(invitation_links.is_used, false),
        gt(invitation_links.expires_at, now)
      )
    )
    .orderBy(desc(invitation_links.created_at))

  return links.map(l => ({
    ...l,
    expires_at: l.expires_at.toISOString(),
    created_at: l.created_at?.toISOString() || null
  }))
}

export async function getInviteDetails(token: string) {
  const [invite] = await db
    .select()
    .from(invitation_links)
    .where(eq(invitation_links.token, token))

  if (!invite) return { error: "Invalid link" }
  if (invite.is_used) return { error: "Link already used" }
  if (new Date() > new Date(invite.expires_at)) return { error: "Link expired" }

  if (invite.member_id) {
    const [member] = await db.select().from(members).where(eq(members.id, invite.member_id))
    if (!member) return { error: "Member not found" }
    // Do NOT return the full member data here to avoid exposing PII without DOB check
    return { 
      type: "edit", 
      member_id: invite.member_id,
      first_name: member.first_name, // safe to show who they are editing
      last_name: member.last_name
    }
  }

  return { type: "new" }
}

export async function verifyDobAndGetMember(token: string, dobString: string) {
  const [invite] = await db
    .select()
    .from(invitation_links)
    .where(eq(invitation_links.token, token))

  if (!invite || invite.is_used || new Date() > new Date(invite.expires_at)) {
    return { error: "Invalid or expired link" }
  }

  if (!invite.member_id) return { error: "Not an edit link" }

  const [member] = await db.select().from(members).where(eq(members.id, invite.member_id))
  
  if (!member) return { error: "Member not found" }
  
  if (member.birth_date !== dobString) {
    return { error: "Incorrect Date of Birth" }
  }

  // Also fetch their ministries & offerings (minimal version since they edit it in form)
  // We'll reconstruct the shape MemberForm expects
  const minRows = await db
    .select({ id: member_ministries.ministry_id })
    .from(member_ministries)
    .where(eq(member_ministries.member_id, member.id))

  // Find commitments for current year
  const currentYear = new Date().getFullYear()
  const existingCommitments = await db
    .select()
    .from(commitments)
    .where(and(eq(commitments.member_id, member.id), eq(commitments.year, currentYear)))

  let min = minRows.map(m => m.id)
  let off: string[] = []

  if (existingCommitments.length > 0) {
    const cId = existingCommitments[0].id
    const cMin = await db.select().from(commitment_ministries).where(eq(commitment_ministries.commitment_id, cId))
    const cOff = await db.select().from(commitment_offerings).where(eq(commitment_offerings.commitment_id, cId))
    min = [...new Set([...min, ...cMin.map(m => m.ministry_id)])]
    off = cOff.map(o => o.offering_category_id)
  }

  const memberData = {
    ...member,
    ministries: min,
    offerings: off
  }

  return { success: true, member: memberData }
}

export async function submitInviteForm(token: string, payloadStr: string) {
  // Verify token again before allowing insert/update
  const [invite] = await db
    .select()
    .from(invitation_links)
    .where(eq(invitation_links.token, token))

  if (!invite || invite.is_used || new Date() > new Date(invite.expires_at)) {
    throw new Error("Link is invalid or expired")
  }

  if (invite.member_id) {
    // Inject the correct ID to prevent ID spoofing
    const data = JSON.parse(payloadStr)
    data.id = invite.member_id
    await coreUpdateMember(JSON.stringify(data))
  } else {
    await coreCreateMember(payloadStr)
  }

  // Mark token as used
  await db.update(invitation_links).set({ is_used: true }).where(eq(invitation_links.token, token))
}

export async function getMembersList() {
  const result = await db.select({
    id: members.id,
    first_name: members.first_name,
    middle_name: members.middle_name,
    last_name: members.last_name,
    suffix: members.suffix,
    email: members.email,
    contact_number: members.contact_number
  }).from(members)
  return result
}

