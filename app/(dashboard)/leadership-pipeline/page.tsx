import { db } from "@/db"
import { members, member_ministries, ministries, org_chart_nodes } from "@/db/schema"
import { eq, sql, desc, count, and, isNotNull } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LeadershipPipelineClient } from "./LeadershipPipelineClient"
import { Users, Crown, TrendingUp, Award, UserCheck, Shield } from "lucide-react"

export const revalidate = 0 // Disable cache for fresh data
export const metadata = { title: "Leadership Pipeline | CBT Database" }

export default async function LeadershipPipelinePage() {
  // Fetch comprehensive leadership data
  const [
    allMembers,
    ministryParticipation,
    orgChartPositions,
    totalMinistries
  ] = await Promise.all([
    db.select({
      id: members.id,
      first_name: members.first_name,
      middle_name: members.middle_name,
      last_name: members.last_name,
      suffix: members.suffix,
      age: members.age,
      city: members.city,
      occupation: members.occupation,
      employment_status: members.employment_status,
      highest_educational_attainment: members.highest_educational_attainment,
      years_in_church: members.years_in_church,
      membership_date: members.membership_date,
      date_baptized: members.date_baptized,
      church_role: members.church_role,
      created_at: members.created_at
    }).from(members).orderBy(desc(members.created_at)),
    
    db.select({
      member_id: member_ministries.member_id,
      ministry_id: member_ministries.ministry_id,
      ministry_name: ministries.name
    }).from(member_ministries)
      .leftJoin(ministries, eq(member_ministries.ministry_id, ministries.id)),
    
    db.select({
      id: org_chart_nodes.id,
      role_title: org_chart_nodes.role_title,
      member_id: org_chart_nodes.member_id,
      parent_id: org_chart_nodes.parent_id
    }).from(org_chart_nodes),
    
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(ministries)
  ])

  const ministryCount = totalMinistries[0]?.count || 0

  // Calculate leadership potential scores
  const leadershipCandidates = allMembers.map(member => {
    const memberMinistries = ministryParticipation.filter(mp => mp.member_id === member.id)
    const currentPosition = orgChartPositions.find(pos => pos.member_id === member.id)
    
    // Leadership Score Factors
    let leadershipScore = 0
    
    // 1. Tenure in church (max 25 points)
    const yearsInChurch = member.years_in_church || 0
    leadershipScore += Math.min(yearsInChurch * 5, 25)
    
    // 2. Ministry involvement (max 30 points)
    const ministryCount = memberMinistries.length
    leadershipScore += Math.min(ministryCount * 10, 30)
    
    // 3. Spiritual maturity indicators (max 25 points)
    if (member.date_baptized) leadershipScore += 10
    if (member.membership_date) leadershipScore += 5
    if (member.church_role && member.church_role !== 'Member') leadershipScore += 10
    
    // 4. Current leadership position (max 20 points)
    if (currentPosition) {
      leadershipScore += 20
    }
    
    // 5. Educational background (max 10 points)
    if (member.highest_educational_attainment) {
      const education = member.highest_educational_attainment.toLowerCase()
      if (education.includes('college') || education.includes('bachelor')) leadershipScore += 5
      if (education.includes('master') || education.includes('doctor')) leadershipScore += 10
    }
    
    // Determine leadership level
    let leadershipLevel: 'potential' | 'emerging' | 'established' | 'senior' = 'potential'
    if (leadershipScore >= 80) leadershipLevel = 'senior'
    else if (leadershipScore >= 60) leadershipLevel = 'established'
    else if (leadershipScore >= 40) leadershipLevel = 'emerging'
    
    return {
      ...member,
      created_at: member.created_at ? (typeof member.created_at === 'object' ? (member.created_at as Date).toISOString() : member.created_at as string) : null,
      membership_date: member.membership_date ? (typeof member.membership_date === 'object' ? (member.membership_date as Date).toISOString() : member.membership_date as string) : null,
      date_baptized: member.date_baptized ? (typeof member.date_baptized === 'object' ? (member.date_baptized as Date).toISOString() : member.date_baptized as string) : null,
      leadershipScore,
      leadershipLevel,
      ministryCount: memberMinistries.length,
      ministryNames: memberMinistries.map(mp => mp.ministry_name).filter(Boolean),
      currentPosition: currentPosition?.role_title || null,
      isCurrentlyInLeadership: !!currentPosition
    }
  })

  // Filter and sort candidates
  const highPotentialCandidates = leadershipCandidates
    .filter(m => m.leadershipScore >= 40)
    .sort((a, b) => b.leadershipScore - a.leadershipScore)
    .slice(0, 20)

  const emergingLeaders = highPotentialCandidates.filter(m => m.leadershipLevel === 'emerging')
  const establishedLeaders = highPotentialCandidates.filter(m => m.leadershipLevel === 'established')
  const seniorLeaders = highPotentialCandidates.filter(m => m.leadershipLevel === 'senior')
  const currentlyInLeadership = highPotentialCandidates.filter(m => m.isCurrentlyInLeadership)

  // Age distribution analysis
  const ageGroups = {
    young: highPotentialCandidates.filter(m => m.age && m.age <= 35).length,
    mid: highPotentialCandidates.filter(m => m.age && m.age > 35 && m.age <= 55).length,
    senior: highPotentialCandidates.filter(m => m.age && m.age > 55).length,
  }

  // Tenure distribution
  const tenureGroups = {
    new: highPotentialCandidates.filter(m => m.years_in_church && m.years_in_church <= 2).length,
    growing: highPotentialCandidates.filter(m => m.years_in_church && m.years_in_church > 2 && m.years_in_church <= 5).length,
    mature: highPotentialCandidates.filter(m => m.years_in_church && m.years_in_church > 5).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Crown className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leadership Pipeline</h1>
          <p className="text-muted-foreground text-sm">Identify and track potential leaders for church ministry.</p>
        </div>
      </div>

      {/* Leadership Pipeline KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-t-4 border-t-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Potential</CardTitle>
            <div className="h-8 w-8 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{highPotentialCandidates.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Leadership candidates</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emerging</CardTitle>
            <div className="h-8 w-8 bg-green-500/10 rounded-full flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{emergingLeaders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for development</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Established</CardTitle>
            <div className="h-8 w-8 bg-purple-500/10 rounded-full flex items-center justify-center">
              <Award className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{establishedLeaders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active leaders</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Senior</CardTitle>
            <div className="h-8 w-8 bg-amber-500/10 rounded-full flex items-center justify-center">
              <Crown className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{seniorLeaders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Senior leaders</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-cyan-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Position</CardTitle>
            <div className="h-8 w-8 bg-cyan-500/10 rounded-full flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-cyan-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentlyInLeadership.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Current leaders</p>
          </CardContent>
        </Card>
      </div>

      {/* Leadership Pipeline Details */}
      <LeadershipPipelineClient 
        candidates={highPotentialCandidates}
        ageGroups={ageGroups}
        tenureGroups={tenureGroups}
        totalMinistries={ministryCount}
      />
    </div>
  )
}