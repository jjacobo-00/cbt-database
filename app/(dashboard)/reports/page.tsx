import { db } from "@/db"
import { members } from "@/db/schema"
import { ReportsClient, ReportMember } from "./ReportsClient"

export const revalidate = 0 // Disable cache for fresh reports

export const metadata = { title: "Reports & Analytics | CBT Database" }

export default async function ReportsPage() {
  // Fetch comprehensive data for reports and export
  const membersData = await db.select({
    id: members.id,
    first_name: members.first_name,
    last_name: members.last_name,
    sex: members.sex,
    age: members.age,
    city: members.city,
    marital_status: members.marital_status,
    occupation: members.occupation,
    employment_status: members.employment_status,
    highest_educational_attainment: members.highest_educational_attainment,
    date_baptized: members.date_baptized,
    created_at: members.created_at
  }).from(members)

  const formattedData: ReportMember[] = membersData.map(m => ({
    ...m,
    date_baptized: m.date_baptized || null,
    created_at: m.created_at?.toISOString() || null,
  }))

  return <ReportsClient initialData={formattedData} />
}
