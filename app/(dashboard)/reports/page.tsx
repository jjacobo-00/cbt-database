import { db } from "@/db"
import { members, member_ministries, ministries, commitments, commitment_offerings, offering_categories } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { ReportsClient } from "./ReportsClient"

export type ReportMember = {
  id: string
  first_name: string
  last_name: string
  gender: string | null
  sex: string | null
  age: number | null
  city: string | null
  marital_status: string | null
  occupation: string | null
  employment_status: string | null
  highest_educational_attainment: string | null
  date_baptized: string | null
  membership_date: string | null
  created_at: string | null
}

export const revalidate = 0 // Disable cache for fresh reports

export const metadata = { title: "Reports & Analytics | CBT Database" }

export default async function ReportsPage() {
  // Fetch comprehensive data for reports and export
  const [
    membersData,
    ministryParticipationData,
    faithPromiseData
  ] = await Promise.all([
    db.select({
      id: members.id,
      first_name: members.first_name,
      last_name: members.last_name,
      gender: members.gender,
      sex: members.sex,
      age: members.age,
      city: members.city,
      marital_status: members.marital_status,
      occupation: members.occupation,
      employment_status: members.employment_status,
      highest_educational_attainment: members.highest_educational_attainment,
      date_baptized: members.date_baptized,
      membership_date: sql`COALESCE(${members.membership_date}, ${members.created_at})`,
      created_at: members.created_at
    }).from(members),
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
      .leftJoin(offering_categories, eq(commitment_offerings.offering_category_id, offering_categories.id))
  ])

  const formattedData: ReportMember[] = membersData.map(m => ({
    ...m,
    date_baptized: m.date_baptized ? (typeof m.date_baptized === 'object' ? (m.date_baptized as Date).toISOString() : m.date_baptized as string) : null,
    membership_date: m.membership_date ? (typeof m.membership_date === 'object' ? (m.membership_date as Date).toISOString() : m.membership_date as string) : null,
    created_at: m.created_at ? (typeof m.created_at === 'object' ? (m.created_at as Date).toISOString() : m.created_at as string) : null,
  }))

  return <ReportsClient 
    initialData={formattedData} 
    ministryData={ministryParticipationData}
    faithPromiseData={faithPromiseData}
  />
}
