"use server"

import { db } from "@/db"
import { ministries, members, member_ministries, attendance_sessions, member_permissions } from "@/db/schema"
import { eq, and, desc, inArray, sql, asc } from "drizzle-orm"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/utils/action-helpers"

import { isDemographicMinistry } from "@/lib/constants/demographic-ministries"

export async function getAuthorizedMinistries() {
  const session = await auth()
  if (!session?.user) return []

  const isAdmin = session.user.role === "admin"
  const memberId = session.user.memberId

  const allMinistries = await db
    .select({
      id: ministries.id,
      name: ministries.name,
      description: ministries.description,
      leader_id: ministries.leader_id,
      co_leader_ids: ministries.co_leader_ids,
      for_everyone: ministries.for_everyone,
    })
    .from(ministries)
    .orderBy(asc(ministries.name))

  // Filter strictly to core demographic ministries
  const demographicMinistries = allMinistries.filter((m) =>
    isDemographicMinistry(m.name)
  )

  if (isAdmin) {
    return demographicMinistries
  }

  if (!memberId) return []

  // Check member_permissions for delegated attendance access
  let delegatedMinistryIds: string[] = []
  try {
    const [perms] = await db
      .select()
      .from(member_permissions)
      .where(eq(member_permissions.member_id, memberId))
    if (perms && perms.can_manage_attendance && Array.isArray(perms.attendance_ministry_ids)) {
      delegatedMinistryIds = perms.attendance_ministry_ids as string[]
    }
  } catch {
    // Non-fatal fallback
  }

  // Filter for member: primary leader, co-leader, OR explicitly delegated
  return demographicMinistries.filter((m) => {
    if (m.leader_id === memberId) return true
    if (Array.isArray(m.co_leader_ids) && m.co_leader_ids.includes(memberId)) return true
    if (delegatedMinistryIds.includes(m.id)) return true
    return false
  })
}

export async function getMinistryAttendanceData(ministryId: string, dateStr: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  // 1. Fetch Members Enrolled in this Ministry
  const enrolledMembers = await db
    .select({
      id: members.id,
      first_name: members.first_name,
      middle_name: members.middle_name,
      last_name: members.last_name,
      suffix: members.suffix,
      gender: members.gender,
      contact_number: members.contact_number,
      church_role: members.church_role,
    })
    .from(member_ministries)
    .innerJoin(members, eq(member_ministries.member_id, members.id))
    .where(eq(member_ministries.ministry_id, ministryId))
    .orderBy(asc(members.last_name), asc(members.first_name))

  // Fetch all specialized ministry enrollments for these members (excluding "For Everyone" default ministries)
  const memberIds = enrolledMembers.map((m) => m.id)
  let multiMinistryMap: Record<string, string[]> = {}
  if (memberIds.length > 0) {
    const enrollments = await db
      .select({
        member_id: member_ministries.member_id,
        ministry_id: member_ministries.ministry_id,
        ministry_name: ministries.name,
        for_everyone: ministries.for_everyone,
      })
      .from(member_ministries)
      .innerJoin(ministries, eq(member_ministries.ministry_id, ministries.id))
      .where(inArray(member_ministries.member_id, memberIds))

    enrollments.forEach((e) => {
      // Only count active specialized ministries (exclude current ministry & "For Everyone" general ministries)
      if (e.ministry_id !== ministryId && !e.for_everyone) {
        if (!multiMinistryMap[e.member_id]) multiMinistryMap[e.member_id] = []
        multiMinistryMap[e.member_id].push(e.ministry_name)
      }
    })
  }

  // 2. Fetch existing session for target date if recorded
  const [existingSession] = await db
    .select()
    .from(attendance_sessions)
    .where(and(eq(attendance_sessions.ministry_id, ministryId), eq(attendance_sessions.date, dateStr)))

  return {
    members: enrolledMembers.map((m) => ({
      ...m,
      other_ministries: multiMinistryMap[m.id] || [],
      ministries_count: (multiMinistryMap[m.id] || []).length,
    })),
    session: existingSession
      ? {
          id: existingSession.id,
          ministry_id: existingSession.ministry_id,
          date: existingSession.date,
          notes: existingSession.notes || "",
          present_member_ids: (existingSession.present_member_ids as string[]) || [],
          present_count: existingSession.present_count,
          total_enrolled: existingSession.total_enrolled,
          submitted_by_name: existingSession.submitted_by_name || "",
          updated_at: existingSession.updated_at?.toISOString() || "",
        }
      : null,
  }
}

export async function saveAttendanceSession(payload: {
  ministryId: string
  date: string
  presentMemberIds: string[]
  notes?: string
}) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const { ministryId, date, presentMemberIds, notes } = payload
  if (!ministryId || !date) throw new Error("Ministry and Date are required.")

  const isAdmin = session.user.role === "admin"
  const memberId = session.user.memberId

  // Fetch ministry info
  const [min] = await db
    .select({
      id: ministries.id,
      name: ministries.name,
      leader_id: ministries.leader_id,
      co_leader_ids: ministries.co_leader_ids,
    })
    .from(ministries)
    .where(eq(ministries.id, ministryId))

  if (!min) {
    throw new Error("Ministry not found.")
  }

  // Strict check: only demographic ministries allow attendance recording
  const isDemographic = isDemographicMinistry(min.name)
  if (!isDemographic) {
    throw new Error("Attendance recording is only authorized for core demographic ministries (Men of Faith, Ladies for Christ, Kids for Jesus Ministry, Youth Christian Ministry).")
  }

  if (!isAdmin) {
    const isPrimary = min.leader_id === memberId
    const isCoLeader = Array.isArray(min.co_leader_ids) && min.co_leader_ids.includes(memberId || "")

    let isDelegated = false
    if (memberId) {
      const [perms] = await db
        .select()
        .from(member_permissions)
        .where(eq(member_permissions.member_id, memberId))
      if (perms?.can_manage_attendance && Array.isArray(perms.attendance_ministry_ids)) {
        isDelegated = (perms.attendance_ministry_ids as string[]).includes(ministryId)
      }
    }

    if (!isPrimary && !isCoLeader && !isDelegated) {
      throw new Error("You are not authorized to submit attendance for this ministry.")
    }
  }

  // Count total enrolled members currently
  const [countRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(member_ministries)
    .where(eq(member_ministries.ministry_id, ministryId))

  const totalEnrolled = countRes?.count || presentMemberIds.length

  const submitterName = session.user.name || session.user.email || "Church Leader"

  // Upsert attendance session
  const [upserted] = await db
    .insert(attendance_sessions)
    .values({
      ministry_id: ministryId,
      date,
      submitted_by: memberId || null,
      submitted_by_name: submitterName,
      notes: notes || null,
      present_member_ids: presentMemberIds,
      present_count: presentMemberIds.length,
      total_enrolled: totalEnrolled,
      updated_at: new Date(),
    })
    .onConflictDoUpdate({
      target: [attendance_sessions.ministry_id, attendance_sessions.date],
      set: {
        submitted_by: memberId || null,
        submitted_by_name: submitterName,
        notes: notes || null,
        present_member_ids: presentMemberIds,
        present_count: presentMemberIds.length,
        total_enrolled: totalEnrolled,
        updated_at: new Date(),
      },
    })
    .returning()

  revalidatePath("/attendance")
  revalidatePath("/dashboard")
  revalidatePath("/reports")

  return { success: true, data: upserted }
}

export async function getAttendanceHistory(ministryId: string) {
  const session = await auth()
  if (!session?.user) return []

  const history = await db
    .select()
    .from(attendance_sessions)
    .where(eq(attendance_sessions.ministry_id, ministryId))
    .orderBy(desc(attendance_sessions.date))
    .limit(30)

  return history.map((s) => ({
    ...s,
    created_at: s.created_at?.toISOString() || "",
    updated_at: s.updated_at?.toISOString() || "",
    present_member_ids: (s.present_member_ids as string[]) || [],
    rate_pct: s.total_enrolled > 0 ? Math.round((s.present_count / s.total_enrolled) * 100) : 0,
  }))
}

export async function getAttendanceAnalytics(ministryId?: string) {
  const session = await auth()
  if (!session?.user) return null

  // 1. Weekly trend analytics over last 12 sessions
  const sessionsList = ministryId
    ? await db
        .select()
        .from(attendance_sessions)
        .where(eq(attendance_sessions.ministry_id, ministryId))
        .orderBy(asc(attendance_sessions.date))
        .limit(16)
    : await db
        .select({
          date: attendance_sessions.date,
          present_count: sql<number>`sum(${attendance_sessions.present_count})::int`,
          total_enrolled: sql<number>`sum(${attendance_sessions.total_enrolled})::int`,
        })
        .from(attendance_sessions)
        .groupBy(attendance_sessions.date)
        .orderBy(asc(attendance_sessions.date))
        .limit(16)

  const trend = sessionsList.map((s) => {
    const total = s.total_enrolled || 1
    const rate = Math.min(100, Math.round((s.present_count / total) * 100))
    return {
      date: s.date,
      present: s.present_count,
      enrolled: s.total_enrolled,
      rate,
    }
  })

  // 2. Ministry comparison bar chart
  const ministryComparison = await db
    .select({
      id: ministries.id,
      name: ministries.name,
      avg_present: sql<number>`round(avg(${attendance_sessions.present_count}))::int`,
      avg_enrolled: sql<number>`round(avg(${attendance_sessions.total_enrolled}))::int`,
      total_sessions: sql<number>`count(${attendance_sessions.id})::int`,
    })
    .from(ministries)
    .innerJoin(attendance_sessions, eq(attendance_sessions.ministry_id, ministries.id))
    .groupBy(ministries.id, ministries.name)

  const ministryComparisonData = ministryComparison.map((m) => {
    const enrolled = m.avg_enrolled || 1
    return {
      id: m.id,
      name: m.name,
      avg_present: m.avg_present,
      rate: Math.min(100, Math.round((m.avg_present / enrolled) * 100)),
      total_sessions: m.total_sessions,
    }
  })

  return {
    trend,
    ministryComparison: ministryComparisonData,
  }
}
