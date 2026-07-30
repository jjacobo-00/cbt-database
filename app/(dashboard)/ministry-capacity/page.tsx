import { db } from "@/db"
import { members, member_ministries, ministries } from "@/db/schema"
import { eq, sql, desc, count } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MinistryCapacityClient } from "./MinistryCapacityClient"
import { Users, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react"

export const revalidate = 0 // Disable cache for fresh data
export const metadata = { title: "Ministry Capacity | CBT Database" }

export default async function MinistryCapacityPage() {
  // Fetch comprehensive ministry capacity data
  const [
    allMinistries,
    ministryParticipation,
    totalMembers,
    ministryEngagementStats
  ] = await Promise.all([
    db.select({
      id: ministries.id,
      name: ministries.name,
      description: ministries.description,
      for_everyone: ministries.for_everyone,
      created_at: ministries.created_at
    }).from(ministries).orderBy(desc(ministries.created_at)),
    
    db.select({
      ministry_id: member_ministries.ministry_id,
      member_id: member_ministries.member_id,
      member_age: members.age,
      member_city: members.city,
      member_occupation: members.occupation,
      member_employment_status: members.employment_status
    }).from(member_ministries)
      .leftJoin(members, eq(member_ministries.member_id, members.id)),
    
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(members),
    
    db.select({
      ministry_id: member_ministries.ministry_id,
      participant_count: count()
    }).from(member_ministries)
      .groupBy(member_ministries.ministry_id)
  ])

  const totalMemberCount = totalMembers[0]?.count || 0

  // Calculate ministry capacity metrics
  const ministryCapacityData = allMinistries.map(ministry => {
    const participants = ministryParticipation.filter(mp => mp.ministry_id === ministry.id)
    const engagementStats = ministryEngagementStats.find(es => es.ministry_id === ministry.id)
    const ministryCreatedAt = ministry.created_at instanceof Date ? ministry.created_at : new Date(ministry.created_at || Date.now())
    
    // Age demographics for this ministry
    const ageGroups = {
      kids: participants.filter(p => p.member_age && p.member_age <= 12).length,
      youth: participants.filter(p => p.member_age && p.member_age <= 17 && p.member_age > 12).length,
      youngAdults: participants.filter(p => p.member_age && p.member_age <= 35 && p.member_age > 17).length,
      adults: participants.filter(p => p.member_age && p.member_age <= 55 && p.member_age > 35).length,
      seniors: participants.filter(p => p.member_age && p.member_age > 55).length,
    }
    
    // Employment status breakdown
    const employmentBreakdown = {
      employed: participants.filter(p => p.member_employment_status === 'Employed').length,
      unemployed: participants.filter(p => p.member_employment_status === 'Unemployed').length,
      student: participants.filter(p => p.member_employment_status === 'Student').length,
      retired: participants.filter(p => p.member_employment_status === 'Retired').length,
      selfEmployed: participants.filter(p => p.member_employment_status === 'Self-employed').length,
    }
    
    // Geographic distribution
    const cities = new Set(participants.map(p => p.member_city).filter(Boolean))
    
    return {
      ...ministry,
      participantCount: participants.length,
      engagementRate: totalMemberCount ? Math.round((participants.length / totalMemberCount) * 100) : 0,
      ageGroups,
      employmentBreakdown,
      geographicReach: cities.size,
      growthTrend: (Math.random() > 0.5 ? 'growing' : 'stable') as 'growing' | 'stable', // In real implementation, calculate from historical data
      capacityStatus: (participants.length < 5 ? 'needs_volunteers' : participants.length < 15 ? 'adequate' : 'growing') as 'needs_volunteers' | 'adequate' | 'growing',
      created_at: ministryCreatedAt
    }
  })

  // Overall capacity metrics
  const totalMinistryParticipants = ministryParticipation.length
  const avgParticipantsPerMinistry = allMinistries.length ? Math.round(totalMinistryParticipants / allMinistries.length) : 0
  const ministriesNeedingVolunteers = ministryCapacityData.filter(m => m.capacityStatus === 'needs_volunteers').length
  const growingMinistries = ministryCapacityData.filter(m => m.capacityStatus === 'growing').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ministry Capacity Report</h1>
          <p className="text-muted-foreground text-sm">Analyze ministry engagement and volunteer capacity for planning.</p>
        </div>
      </div>

      {/* Overall Capacity KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-t-4 border-t-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <div className="h-8 w-8 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalMinistryParticipants}</div>
            <p className="text-xs text-muted-foreground mt-1">Across {allMinistries.length} ministries</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growing Ministries</CardTitle>
            <div className="h-8 w-8 bg-green-500/10 rounded-full flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{growingMinistries}</div>
            <p className="text-xs text-muted-foreground mt-1">With 15+ participants</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Volunteers</CardTitle>
            <div className="h-8 w-8 bg-amber-500/10 rounded-full flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{ministriesNeedingVolunteers}</div>
            <p className="text-xs text-muted-foreground mt-1">With less than 5 participants</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-cyan-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg/Ministry</CardTitle>
            <div className="h-8 w-8 bg-cyan-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-cyan-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgParticipantsPerMinistry}</div>
            <p className="text-xs text-muted-foreground mt-1">Average participants</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Capacity KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-t-4 border-t-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <div className="h-8 w-8 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalMinistryParticipants}</div>
            <p className="text-xs text-muted-foreground mt-1">Across {allMinistries.length} ministries</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growing Ministries</CardTitle>
            <div className="h-8 w-8 bg-green-500/10 rounded-full flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{growingMinistries}</div>
            <p className="text-xs text-muted-foreground mt-1">With 15+ participants</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Volunteers</CardTitle>
            <div className="h-8 w-8 bg-amber-500/10 rounded-full flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{ministriesNeedingVolunteers}</div>
            <p className="text-xs text-muted-foreground mt-1">With less than 5 participants</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-cyan-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg/Ministry</CardTitle>
            <div className="h-8 w-8 bg-cyan-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-cyan-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgParticipantsPerMinistry}</div>
            <p className="text-xs text-muted-foreground mt-1">Average participants</p>
          </CardContent>
        </Card>
      </div>

      {/* Ministry Capacity Details */}
      <MinistryCapacityClient ministryData={ministryCapacityData} />
    </div>
  )
}