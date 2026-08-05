"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { members, ministries, member_ministries, commitments, commitment_ministries, commitment_offerings, invitation_links, children, org_chart_nodes, missions } from "@/db/schema"
import crypto from "crypto"
import { eq, and, gt, desc, isNull, inArray, notInArray, ne } from "drizzle-orm"
import { requireAdmin, requireSelfOrAdmin } from "@/lib/utils/action-helpers"

export async function coreCreateMember(payloadStr: string) {
  const data = JSON.parse(payloadStr)

  if (data.church_role === "Main Pastor") {
    await db.update(members).set({ church_role: "Member" }).where(eq(members.church_role, "Main Pastor"))
  }

  const [member] = await db.insert(members).values({
    // Step 1: Personal
    first_name: data.first_name,
    middle_name: data.middle_name || "",
    last_name: data.last_name,
    suffix: data.suffix || "",
    birth_date: data.birth_date || null,
    birth_place: data.birth_place || "",
    gender: data.gender,
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
    
    // Medical & Health
    blood_type: data.blood_type || "",
    allergies: data.allergies || "",
    medical_conditions: data.medical_conditions || "",
    
    // Spiritual & Church Info
    church_role: data.church_role || "Member",
    mission_id: data.mission_id || null,
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

  // TWO-WAY SIBLING SYNC
  if (data.siblings && Array.isArray(data.siblings)) {
    for (const s of data.siblings) {
      if (s.sibling_member_id) {
        const [siblingMember] = await db.select({ siblings: members.siblings }).from(members).where(eq(members.id, s.sibling_member_id))
        if (siblingMember) {
          let theirSiblings = Array.isArray(siblingMember.siblings) ? [...siblingMember.siblings] : []
          const alreadyExists = theirSiblings.some((ts: any) => ts.sibling_member_id === member.id)
          if (!alreadyExists) {
            theirSiblings.push({
              name: `${member.first_name} ${member.last_name}`,
              birth_date: member.birth_date || "",
              sibling_is_member: true,
              sibling_member_id: member.id
            })
            await db.update(members).set({ siblings: theirSiblings }).where(eq(members.id, s.sibling_member_id))
          }
        }
      }
    }
  }

  return member.id
}

export async function createMember(payloadStr: string) {
  await requireAdmin()
  const memberId = await coreCreateMember(payloadStr)
  revalidatePath("/members")
  revalidatePath("/commitments")
  redirect(`/members/${memberId}`)
}

export async function coreUpdateMember(payloadStr: string) {
  const data = JSON.parse(payloadStr)
  const id = data.id

  if (data.church_role === "Main Pastor") {
    await db.update(members).set({ church_role: "Member" }).where(and(eq(members.church_role, "Main Pastor"), ne(members.id, id)))
    const existingNodes = await db.select().from(org_chart_nodes).where(isNull(org_chart_nodes.parent_id))
    if (existingNodes.length > 0) {
      await db.update(org_chart_nodes).set({ member_id: id, role_title: "Main Pastor" }).where(eq(org_chart_nodes.id, existingNodes[0].id))
    } else {
      await db.insert(org_chart_nodes).values({ role_title: "Main Pastor", member_id: id, parent_id: null, sort_order: 0 })
    }
  }

  const [existingMember] = await db.select({ spouse_member_id: members.spouse_member_id, siblings: members.siblings, church_role: members.church_role }).from(members).where(eq(members.id, id))

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
    
    // Medical & Health
    blood_type: data.blood_type || "",
    allergies: data.allergies || "",
    medical_conditions: data.medical_conditions || "",
    
    // Spiritual & Church Info
    church_role: data.church_role || existingMember?.church_role || "Member",
    mission_id: data.mission_id || null,
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

  // TWO-WAY SIBLING SYNC (UPDATE)
  const oldSiblings = existingMember?.siblings || []
  const newSiblings = data.siblings || []
  
  const oldSiblingIds = (Array.isArray(oldSiblings) ? oldSiblings : [])
    .map((s: any) => s.sibling_member_id)
    .filter(Boolean)
  const newSiblingIds = (Array.isArray(newSiblings) ? newSiblings : [])
    .map((s: any) => s.sibling_member_id)
    .filter(Boolean)

  const addedSiblings = newSiblingIds.filter(id => !oldSiblingIds.includes(id))
  const removedSiblings = oldSiblingIds.filter(id => !newSiblingIds.includes(id))

  // Process additions
  for (const siblingId of addedSiblings) {
    const [sm] = await db.select({ siblings: members.siblings }).from(members).where(eq(members.id, siblingId))
    if (sm) {
      let theirSiblings = Array.isArray(sm.siblings) ? [...sm.siblings] : []
      if (!theirSiblings.some((ts: any) => ts.sibling_member_id === id)) {
        theirSiblings.push({
          name: `${data.first_name} ${data.last_name}`,
          birth_date: data.birth_date || "",
          sibling_is_member: true,
          sibling_member_id: id
        })
        await db.update(members).set({ siblings: theirSiblings }).where(eq(members.id, siblingId))
      }
    }
  }

  // Process removals
  for (const siblingId of removedSiblings) {
    const [sm] = await db.select({ siblings: members.siblings }).from(members).where(eq(members.id, siblingId))
    if (sm) {
      let theirSiblings = Array.isArray(sm.siblings) ? [...sm.siblings] : []
      theirSiblings = theirSiblings.filter((ts: any) => ts.sibling_member_id !== id)
      await db.update(members).set({ siblings: theirSiblings }).where(eq(members.id, siblingId))
    }
  }

  return id
}

export async function updateMember(payloadStr: string) {
  const data = JSON.parse(payloadStr)
  await requireSelfOrAdmin(data.id)
  const memberId = await coreUpdateMember(payloadStr)
  revalidatePath("/members")
  revalidatePath(`/members/${memberId}`)
  redirect(`/members/${memberId}`)
}

export async function deleteMember(id: string) {
  await requireAdmin()
  await db.delete(members).where(eq(members.id, id))
  revalidatePath("/members")
  redirect("/members")
}

// --------------------------------------------------------------------------------------
// INVITATION LINKS (Self-Service)
// --------------------------------------------------------------------------------------

export async function checkMainPastorExists() {
  const existing = await db
    .select({ id: members.id, first_name: members.first_name, last_name: members.last_name })
    .from(members)
    .where(eq(members.church_role, "Main Pastor"))
  return existing.length > 0 ? existing[0] : null
}

export async function generateInviteLink(arg?: string | {
  memberId?: string
  title?: string
  maxUses?: number | null
  presetRole?: string | null
  presetMissionId?: string | null
  expirationMinutes?: number
}) {
  await requireAdmin()
  const options = typeof arg === "string" ? { memberId: arg } : arg

  const token = crypto.randomBytes(32).toString("hex")
  const expMinutes = options?.expirationMinutes || 60
  const expiresAt = new Date(Date.now() + expMinutes * 60 * 1000)

  // Safeguard: If presetRole is "Main Pastor", check if a Main Pastor already exists
  if (options?.presetRole === "Main Pastor") {
    const existingMainPastor = await db.select().from(members).where(eq(members.church_role, "Main Pastor"))
    if (existingMainPastor.length > 0) {
      throw new Error("Cannot generate link for Main Pastor: A Main Pastor is already assigned.")
    }
  }

  // Edit links are locked to 1 use. Main Pastor links are locked to 1 use. Default batch is 50.
  const maxUsesVal = options?.memberId ? 1 : (options?.presetRole === "Main Pastor" ? 1 : (options?.maxUses === 0 ? null : (options?.maxUses || 50)))

  await db.insert(invitation_links).values({
    token,
    member_id: options?.memberId || null,
    title: options?.title || null,
    max_uses: maxUsesVal,
    use_count: 0,
    preset_role: options?.presetRole || null,
    preset_mission_id: options?.presetMissionId || null,
    expires_at: expiresAt,
    is_used: false,
    is_disabled: false,
  })

  return token
}

export async function revokeInviteLink(token: string) {
  await requireAdmin()
  await db.update(invitation_links).set({ is_disabled: true }).where(eq(invitation_links.token, token))
  revalidatePath("/members")
}

export async function getActiveInvitationLinks(memberId?: string) {
  await requireAdmin()
  const now = new Date()
  const links = await db
    .select({
      token: invitation_links.token,
      member_id: invitation_links.member_id,
      title: invitation_links.title,
      max_uses: invitation_links.max_uses,
      use_count: invitation_links.use_count,
      preset_role: invitation_links.preset_role,
      preset_mission_id: invitation_links.preset_mission_id,
      is_disabled: invitation_links.is_disabled,
      expires_at: invitation_links.expires_at,
      is_used: invitation_links.is_used,
      created_at: invitation_links.created_at,
      mission_name: missions.name,
    })
    .from(invitation_links)
    .leftJoin(missions, eq(invitation_links.preset_mission_id, missions.id))
    .where(
      and(
        memberId ? eq(invitation_links.member_id, memberId) : isNull(invitation_links.member_id),
        eq(invitation_links.is_disabled, false),
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
  try {
    if (!token || typeof token !== "string") {
      return { error: "Invalid registration link" }
    }

    const [invite] = await db
      .select({
        token: invitation_links.token,
        member_id: invitation_links.member_id,
        title: invitation_links.title,
        max_uses: invitation_links.max_uses,
        use_count: invitation_links.use_count,
        preset_role: invitation_links.preset_role,
        preset_mission_id: invitation_links.preset_mission_id,
        is_disabled: invitation_links.is_disabled,
        expires_at: invitation_links.expires_at,
        is_used: invitation_links.is_used,
        mission_name: missions.name,
      })
      .from(invitation_links)
      .leftJoin(missions, eq(invitation_links.preset_mission_id, missions.id))
      .where(eq(invitation_links.token, token))

    if (!invite || invite.is_disabled) return { error: "Invalid or revoked link" }
    if (invite.is_used || (invite.max_uses && invite.use_count >= invite.max_uses)) return { error: "Link usage limit reached" }
    if (invite.expires_at && new Date() > new Date(invite.expires_at)) return { error: "Link expired" }

    if (invite.member_id) {
      const [member] = await db.select().from(members).where(eq(members.id, invite.member_id))
      if (!member) return { error: "Member not found" }
      return { 
        type: "edit", 
        member_id: invite.member_id,
        first_name: member.first_name,
        last_name: member.last_name
      }
    }

    return { 
      type: "new",
      preset_role: invite.preset_role || null,
      preset_mission_id: invite.preset_mission_id || null,
      mission_name: invite.mission_name || null,
      title: invite.title || null,
    }
  } catch (error) {
    console.error("Error in getInviteDetails:", error)
    return { error: "Invalid or revoked link" }
  }
}

export async function verifyDobAndGetMember(token: string, dobString: string) {
  const [invite] = await db
    .select()
    .from(invitation_links)
    .where(eq(invitation_links.token, token))

  if (!invite || invite.is_disabled || invite.is_used || new Date() > new Date(invite.expires_at)) {
    return { error: "Invalid or expired link" }
  }

  if (!invite.member_id) return { error: "Not an edit link" }

  const [member] = await db.select().from(members).where(eq(members.id, invite.member_id))
  
  if (!member) return { error: "Member not found" }
  
  if (member.birth_date !== dobString) {
    return { error: "Incorrect Date of Birth" }
  }

  const minRows = await db
    .select({ id: member_ministries.ministry_id })
    .from(member_ministries)
    .where(eq(member_ministries.member_id, member.id))

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
  const [invite] = await db
    .select()
    .from(invitation_links)
    .where(eq(invitation_links.token, token))

  if (!invite || invite.is_disabled) {
    throw new Error("Link is invalid or revoked")
  }
  if (invite.is_used || (invite.max_uses && invite.use_count >= invite.max_uses)) {
    throw new Error("Link usage limit reached")
  }
  if (new Date() > new Date(invite.expires_at)) {
    throw new Error("Link is expired")
  }

  const data = JSON.parse(payloadStr)

  if (invite.member_id) {
    // Edit link for existing member
    data.id = invite.member_id
    await coreUpdateMember(JSON.stringify(data))
    await db.update(invitation_links).set({ is_used: true, use_count: (invite.use_count || 0) + 1 }).where(eq(invitation_links.token, token))
  } else {
    // Registration link for new member
    if (invite.preset_role) {
      data.church_role = invite.preset_role
    }
    if (invite.preset_mission_id && !data.mission_id) {
      data.mission_id = invite.preset_mission_id
    }
    await coreCreateMember(JSON.stringify(data))

    const newUseCount = (invite.use_count || 0) + 1
    const isNowUsed = invite.max_uses ? newUseCount >= invite.max_uses : false
    await db.update(invitation_links).set({ use_count: newUseCount, is_used: isNowUsed }).where(eq(invitation_links.token, token))
  }

  revalidatePath("/members")
  revalidatePath("/dashboard")
  revalidatePath("/commitments")
}

export async function getMembersList(limit = 100, offset = 0) {
  await requireAdmin()
  const result = await db.select({
    id: members.id,
    first_name: members.first_name,
    middle_name: members.middle_name,
    last_name: members.last_name,
    suffix: members.suffix,
    sex: members.sex,
    email: members.email,
    contact_number: members.contact_number,
    position: members.position,
    company: members.company,
    birth_date: members.birth_date,
    last_login_at: members.last_login_at,
  }).from(members).limit(limit).offset(offset)
  return result
}

