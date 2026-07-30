import { db } from "@/db"
import { members, ministries } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getFullName, yearsSince } from "@/lib/utils/format"

/* eslint-disable @typescript-eslint/no-explicit-any */
export type MemberPayload = Record<string, any>

export type SiblingEntry = {
  name: string
  birth_date: string
  sibling_is_member: boolean
  sibling_member_id: string
}

/**
 * Maps a wizard/invite payload onto member table columns. `gender` only exists on
 * creation (`sex` mirrors it on update), so callers add it themselves.
 */
export function buildMemberValues(data: MemberPayload) {
  const permanent = (current: string | undefined | null, permValue: string | undefined | null, fallback: string) =>
    (data.is_perm_same_as_current ? current : permValue) || fallback

  return {
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
    perm_house_number: permanent(data.house_number, data.perm_house_number, ""),
    perm_unit_number: permanent(data.unit_number, data.perm_unit_number, ""),
    perm_street: permanent(data.street || data.address, data.perm_street, ""),
    perm_barangay: permanent(data.barangay, data.perm_barangay, ""),
    perm_city: permanent(data.city, data.perm_city, ""),
    perm_province: permanent(data.province, data.perm_province, ""),
    perm_zip_code: permanent(data.zip_code, data.perm_zip_code, ""),
    perm_country: permanent(data.country, data.perm_country, "Philippines"),

    // Medical & Health
    blood_type: data.blood_type || "",
    allergies: data.allergies || "",
    medical_conditions: data.medical_conditions || "",

    // Spiritual & Church Info
    date_saved: data.date_saved || null,
    membership_date: data.membership_date || null,
    baptism_date: data.baptism_date || null,
    date_baptized: data.date_baptized || data.baptism_date || null,
    baptized_by: data.baptized_by || "",
    witness_by: data.witness_by || "",
    place_of_baptism: data.place_of_baptism || "",
    years_in_church: yearsSince(data.membership_date || data.date_saved || data.baptism_date),

    // Step 2: Status & Occupation
    employment_status: data.employment_status,
    occupation: resolveOccupation(data),
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
  }
}

function resolveOccupation(data: MemberPayload) {
  if (data.occupation) return data.occupation
  if (data.position) return data.position
  if (data.employment_status === "Student") return "Student"
  if (data.company) return `${data.position || "Employee"} at ${data.company}`
  return data.employment_status !== "None" ? data.employment_status : ""
}

/** Selected ministries merged with every "for everyone" ministry. */
export async function resolveMinistryIds(selected: string[]) {
  const forEveryone = await db
    .select({ id: ministries.id })
    .from(ministries)
    .where(eq(ministries.for_everyone, true))
  return [...new Set([...selected, ...forEveryone.map(m => m.id)])]
}

export function toChildRows(memberId: string, childrenPayload: MemberPayload[]) {
  return childrenPayload.map(c => ({
    member_id: memberId,
    name: c.name,
    birth_date: c.birth_date || null,
    child_member_id: c.child_member_id || null,
  }))
}

/** Points a child's father/mother columns at `parent`. */
export async function linkChildToParent(childMemberId: string, parent: { id: string; name: string; gender?: string }) {
  const column = parent.gender === "Male"
    ? { father_member_id: parent.id, father_name: parent.name }
    : { mother_member_id: parent.id, mother_name: parent.name }
  await db.update(members).set(column).where(eq(members.id, childMemberId))
}

/** Adds `sibling` to the sibling list of `siblingMemberId` unless already present. */
export async function addReciprocalSibling(siblingMemberId: string, sibling: SiblingEntry) {
  const [row] = await db.select({ siblings: members.siblings }).from(members).where(eq(members.id, siblingMemberId))
  if (!row) return

  const theirSiblings = Array.isArray(row.siblings) ? [...row.siblings] : []
  if (theirSiblings.some((ts: any) => ts.sibling_member_id === sibling.sibling_member_id)) return

  theirSiblings.push(sibling)
  await db.update(members).set({ siblings: theirSiblings }).where(eq(members.id, siblingMemberId))
}

/** Removes `memberId` from the sibling list of `siblingMemberId`. */
export async function removeReciprocalSibling(siblingMemberId: string, memberId: string) {
  const [row] = await db.select({ siblings: members.siblings }).from(members).where(eq(members.id, siblingMemberId))
  if (!row) return

  const theirSiblings = (Array.isArray(row.siblings) ? row.siblings : [])
    .filter((ts: any) => ts.sibling_member_id !== memberId)
  await db.update(members).set({ siblings: theirSiblings }).where(eq(members.id, siblingMemberId))
}

/** Mirrors the marriage link back onto the spouse record. */
export async function linkSpouse(spouseId: string, member: { id: string; first_name: string; last_name: string }, data: MemberPayload) {
  await db.update(members).set({
    spouse_member_id: member.id,
    spouse_name: getFullName(member),
    marital_status: data.marital_status || "Married",
    anniversary_date: data.anniversary_date || null,
  }).where(eq(members.id, spouseId))
}

export async function unlinkSpouse(spouseId: string) {
  await db.update(members).set({ spouse_member_id: null, spouse_name: "" }).where(eq(members.id, spouseId))
}
