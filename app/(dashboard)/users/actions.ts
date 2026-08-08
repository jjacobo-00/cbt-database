"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { whitelisted_users, members, ministries, member_permissions } from "@/db/schema"
import { eq, desc, asc, inArray } from "drizzle-orm"
import { requireAdmin } from "@/lib/utils/action-helpers"
import { formatName } from "@/lib/utils/utils"
import { ensureMemberPermissionsTable } from "@/lib/utils/ensure-tables"
import { DEMOGRAPHIC_MINISTRIES_CONFIG } from "@/lib/constants/demographic-ministries"

export async function getWhitelistedUsers() {
  await requireAdmin()
  return await db.query.whitelisted_users.findMany({
    orderBy: (users, { desc }) => [desc(users.created_at)],
  })
}

export async function addWhitelistedUser(formData: FormData) {
  await requireAdmin()
  const rawEmail = formData.get("email") as string
  const name = formData.get("name") as string

  if (!rawEmail) return
  const email = rawEmail.trim().toLowerCase()

  await db.insert(whitelisted_users).values({
    email,
    name: name ? formatName(name) : null,
  }).onConflictDoNothing()

  revalidatePath("/users")
}

export async function removeWhitelistedUser(id: string) {
  await requireAdmin()
  await db.delete(whitelisted_users).where(eq(whitelisted_users.id, id))
  revalidatePath("/users")
}

export type DelegatedMemberPermission = {
  id: string
  member_id: string
  first_name: string
  middle_name?: string | null
  last_name: string
  suffix?: string | null
  email?: string | null
  contact_number?: string | null
  gender?: string | null
  church_role?: string | null
  can_manage_attendance: boolean
  attendance_ministry_ids: string[]
  attendance_ministry_names: string[]
  can_manage_members: boolean
  can_manage_offerings: boolean
  can_view_reports: boolean
  notes?: string | null
  created_at: string
  updated_at: string
}

export async function getMemberPermissionsList(): Promise<DelegatedMemberPermission[]> {
  await requireAdmin()
  await ensureMemberPermissionsTable()

  try {
    const rawList = await db
      .select({
        id: member_permissions.id,
        member_id: member_permissions.member_id,
        can_manage_attendance: member_permissions.can_manage_attendance,
        attendance_ministry_ids: member_permissions.attendance_ministry_ids,
        can_manage_members: member_permissions.can_manage_members,
        can_manage_offerings: member_permissions.can_manage_offerings,
        can_view_reports: member_permissions.can_view_reports,
        notes: member_permissions.notes,
        created_at: member_permissions.created_at,
        updated_at: member_permissions.updated_at,
        first_name: members.first_name,
        middle_name: members.middle_name,
        last_name: members.last_name,
        suffix: members.suffix,
        email: members.email,
        contact_number: members.contact_number,
        gender: members.gender,
        church_role: members.church_role,
      })
      .from(member_permissions)
      .innerJoin(members, eq(member_permissions.member_id, members.id))
      .orderBy(desc(member_permissions.updated_at))

    // Fetch all demographic ministries to map IDs to Names
    const allDemographicMinistries = await db
      .select({ id: ministries.id, name: ministries.name })
      .from(ministries)

    const ministryMap = new Map<string, string>()
    allDemographicMinistries.forEach((m) => ministryMap.set(m.id, m.name))

    return rawList.map((row) => {
      const minIds = Array.isArray(row.attendance_ministry_ids)
        ? (row.attendance_ministry_ids as string[])
        : []
      const minNames = minIds.map((id) => ministryMap.get(id) || "Unknown Ministry")

      return {
        id: row.id,
        member_id: row.member_id,
        first_name: row.first_name,
        middle_name: row.middle_name,
        last_name: row.last_name,
        suffix: row.suffix,
        email: row.email,
        contact_number: row.contact_number,
        gender: row.gender,
        church_role: row.church_role,
        can_manage_attendance: row.can_manage_attendance,
        attendance_ministry_ids: minIds,
        attendance_ministry_names: minNames,
        can_manage_members: row.can_manage_members,
        can_manage_offerings: row.can_manage_offerings,
        can_view_reports: row.can_view_reports,
        notes: row.notes,
        created_at: row.created_at?.toISOString() || "",
        updated_at: row.updated_at?.toISOString() || "",
      }
    })
  } catch (error) {
    console.error("[getMemberPermissionsList] Error:", error)
    return []
  }
}

export async function upsertMemberPermission(payload: {
  memberId: string
  canManageAttendance: boolean
  attendanceMinistryIds: string[]
  notes?: string
  canManageMembers?: boolean
  canManageOfferings?: boolean
  canViewReports?: boolean
}) {
  await requireAdmin()
  await ensureMemberPermissionsTable()

  const {
    memberId,
    canManageAttendance,
    attendanceMinistryIds,
    notes,
    canManageMembers = false,
    canManageOfferings = false,
    canViewReports = false,
  } = payload

  if (!memberId) {
    throw new Error("Member is required.")
  }

  await db
    .insert(member_permissions)
    .values({
      member_id: memberId,
      can_manage_attendance: canManageAttendance,
      attendance_ministry_ids: attendanceMinistryIds,
      can_manage_members: canManageMembers,
      can_manage_offerings: canManageOfferings,
      can_view_reports: canViewReports,
      notes: notes?.trim() || null,
      updated_at: new Date(),
    })
    .onConflictDoUpdate({
      target: member_permissions.member_id,
      set: {
        can_manage_attendance: canManageAttendance,
        attendance_ministry_ids: attendanceMinistryIds,
        can_manage_members: canManageMembers,
        can_manage_offerings: canManageOfferings,
        can_view_reports: canViewReports,
        notes: notes?.trim() || null,
        updated_at: new Date(),
      },
    })

  revalidatePath("/users")
  revalidatePath("/attendance")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function removeMemberPermission(memberId: string) {
  await requireAdmin()
  await ensureMemberPermissionsTable()

  await db.delete(member_permissions).where(eq(member_permissions.member_id, memberId))

  revalidatePath("/users")
  revalidatePath("/attendance")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function seedDemographicMinistries() {
  await requireAdmin()
  await ensureMemberPermissionsTable()

  const existing = await db.select({ id: ministries.id, name: ministries.name }).from(ministries)
  const existingNames = new Set(existing.map((m) => m.name.trim().toLowerCase()))

  const toInsert = DEMOGRAPHIC_MINISTRIES_CONFIG.filter(
    (dm) => !existingNames.has(dm.name.trim().toLowerCase())
  )

  if (toInsert.length > 0) {
    await db.insert(ministries).values(
      toInsert.map((dm) => ({
        name: dm.name,
        description: dm.description,
        for_everyone: false,
        parent_id: null,
      }))
    )
  }

  revalidatePath("/users")
  revalidatePath("/attendance")
  revalidatePath("/ministries")
  return { success: true, createdCount: toInsert.length }
}

export async function getDemographicMinistriesList() {
  await requireAdmin()
  await ensureMemberPermissionsTable()

  const allMinistries = await db
    .select({
      id: ministries.id,
      name: ministries.name,
      description: ministries.description,
      leader_id: ministries.leader_id,
      co_leader_ids: ministries.co_leader_ids,
    })
    .from(ministries)
    .orderBy(asc(ministries.name))

  const demographicNames = DEMOGRAPHIC_MINISTRIES_CONFIG.map((m) => m.name.toLowerCase())
  return allMinistries.filter((m) => demographicNames.includes(m.name.trim().toLowerCase()))
}

