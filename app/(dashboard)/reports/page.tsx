import { db } from "@/db"
import { members, member_ministries, ministries, commitments, commitment_offerings, offering_categories, missions, attendance_sessions } from "@/db/schema"
import { eq, sql, desc } from "drizzle-orm"
import { ReportsClient } from "./ReportsClient"

export type ReportMember = {
  id: string
  first_name: string
  last_name: string
  gender: string | null
  sex: string | null
  age: number | null
  birth_date?: string | null
  city: string | null
  mission_id?: string | null
  mission_name?: string | null
  mission_location?: string | null
  marital_status: string | null
  occupation: string | null
  employment_status: string | null
  highest_educational_attainment: string | null
  blood_type?: string | null
  allergies?: string | null
  medical_conditions?: string | null
  emergency_contact_number?: string | null
  years_in_church?: number | null
  date_baptized: string | null
  membership_date: string | null
  created_at: string | null
}

export type ReportAttendanceSession = {
  id: string
  ministry_id: string
  ministry_name: string | null
  date: string
  service_time: string
  submitted_by_name: string | null
  notes: string | null
  present_count: number
  total_enrolled: number
  present_member_ids: string[]
}

export const revalidate = 0 // Disable cache for fresh reports

export const metadata = { title: "Reports & Analytics | CBT Database" }

// Helper function to calculate age from birth_date
function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const today = new Date()
  if (isNaN(birth.getTime())) return null
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age >= 0 ? age : null
}

export default async function ReportsPage() {
  // Fetch comprehensive data for reports and export
  const [
    membersData,
    ministryParticipationData,
    faithPromiseData,
    attendanceSessionsData,
  ] = await Promise.all([
    db.select({
      id: members.id,
      first_name: members.first_name,
      last_name: members.last_name,
      gender: members.gender,
      sex: members.sex,
      age: members.age,
      birth_date: members.birth_date,
      city: members.city,
      mission_id: members.mission_id,
      mission_name: missions.name,
      mission_location: missions.location,
      marital_status: members.marital_status,
      occupation: members.occupation,
      employment_status: members.employment_status,
      highest_educational_attainment: members.highest_educational_attainment,
      blood_type: members.blood_type,
      allergies: members.allergies,
      medical_conditions: members.medical_conditions,
      emergency_contact_number: members.emergency_contact_number,
      years_in_church: members.years_in_church,
      date_baptized: members.date_baptized,
      membership_date: sql`COALESCE(${members.membership_date}, ${members.created_at})`,
      created_at: members.created_at
    }).from(members)
      .leftJoin(missions, eq(members.mission_id, missions.id)),
    db.select({
      member_id: member_ministries.member_id,
      ministry_id: member_ministries.ministry_id,
      ministry_name: ministries.name
    }).from(member_ministries)
      .leftJoin(ministries, eq(member_ministries.ministry_id, ministries.id)),
    db.select({
      member_id: commitments.member_id,
      year: commitments.year,
      offering_category_id: commitment_offerings.offering_category_id,
      category_name: offering_categories.name,
      is_monthly: offering_categories.is_monthly
    }).from(commitments)
      .leftJoin(commitment_offerings, eq(commitments.id, commitment_offerings.commitment_id))
      .leftJoin(offering_categories, eq(commitment_offerings.offering_category_id, offering_categories.id)),
    db.select({
      id: attendance_sessions.id,
      ministry_id: attendance_sessions.ministry_id,
      ministry_name: ministries.name,
      date: attendance_sessions.date,
      service_time: attendance_sessions.service_time,
      submitted_by_name: attendance_sessions.submitted_by_name,
      notes: attendance_sessions.notes,
      present_count: attendance_sessions.present_count,
      total_enrolled: attendance_sessions.total_enrolled,
      present_member_ids: attendance_sessions.present_member_ids,
    }).from(attendance_sessions)
      .leftJoin(ministries, eq(attendance_sessions.ministry_id, ministries.id))
      .orderBy(desc(attendance_sessions.date))
  ])

  const formattedData: ReportMember[] = membersData.map(m => ({
    ...m,
    age: m.age || calculateAge(m.birth_date),
    date_baptized: m.date_baptized ? (typeof m.date_baptized === 'object' ? (m.date_baptized as Date).toISOString() : m.date_baptized as string) : null,
    membership_date: m.membership_date ? (typeof m.membership_date === 'object' ? (m.membership_date as Date).toISOString() : m.membership_date as string) : null,
    created_at: m.created_at ? (typeof m.created_at === 'object' ? (m.created_at as Date).toISOString() : m.created_at as string) : null,
  }))

  const formattedAttendance: ReportAttendanceSession[] = attendanceSessionsData.map(s => ({
    ...s,
    service_time: s.service_time || 'AM',
    present_member_ids: (s.present_member_ids as string[]) || [],
  }))

  return <ReportsClient 
    initialData={formattedData} 
    ministryData={ministryParticipationData}
    faithPromiseData={faithPromiseData}
    attendanceData={formattedAttendance}
  />
}
