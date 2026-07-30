import { db } from "@/db"
import { members, commitments, commitment_offerings, offering_categories } from "@/db/schema"
import { eq, sql, desc, count, and } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StewardshipClient } from "./StewardshipClient"
import { DollarSign, TrendingUp, Target, Calendar, Users } from "lucide-react"

export const revalidate = 0 // Disable cache for fresh data
export const metadata = { title: "Stewardship Analytics | CBT Database" }

export default async function StewardshipPage() {
  const currentYear = new Date().getFullYear()
  const previousYear = currentYear - 1

  // Fetch comprehensive stewardship data
  const [
    totalMembers,
    currentYearCommitments,
    previousYearCommitments,
    offeringCategories,
    commitmentDetails,
    memberGivingData
  ] = await Promise.all([
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(members),
    
    db.select({
      member_id: commitments.member_id,
      year: commitments.year,
      commitment_id: commitments.id
    }).from(commitments).where(eq(commitments.year, currentYear)),
    
    db.select({
      member_id: commitments.member_id,
      year: commitments.year
    }).from(commitments).where(eq(commitments.year, previousYear)),
    
    db.select({
      id: offering_categories.id,
      name: offering_categories.name,
      description: offering_categories.description,
      is_monthly: offering_categories.is_monthly,
      month: offering_categories.month
    }).from(offering_categories),
    
    db.select({
      commitment_id: commitment_offerings.commitment_id,
      offering_category_id: commitment_offerings.offering_category_id,
      category_name: offering_categories.name,
      is_monthly: offering_categories.is_monthly,
      month: offering_categories.month
    }).from(commitment_offerings)
      .leftJoin(offering_categories, eq(commitment_offerings.offering_category_id, offering_categories.id)),
    
    db.select({
      id: members.id,
      first_name: members.first_name,
      last_name: members.last_name,
      city: members.city,
      occupation: members.occupation,
      employment_status: members.employment_status,
      years_in_church: members.years_in_church,
      membership_date: members.membership_date
    }).from(members)
  ])

  const totalMemberCount = totalMembers[0]?.count || 0
  const currentYearCommitmentCount = currentYearCommitments.length
  const previousYearCommitmentCount = previousYearCommitments.length
  const participationRate = totalMemberCount ? Math.round((currentYearCommitmentCount / totalMemberCount) * 100) : 0
  const yearOverYearGrowth = previousYearCommitmentCount ? 
    Math.round(((currentYearCommitmentCount - previousYearCommitmentCount) / previousYearCommitmentCount) * 100) : 0

  // Analyze giving patterns
  const currentYearCommitmentIds = new Set(currentYearCommitments.map(c => c.commitment_id))
  const currentYearOfferings = commitmentDetails.filter(co => currentYearCommitmentIds.has(co.commitment_id))

  // Category analysis
  const categoryAnalysis = offeringCategories.map(category => {
    const commitments = currentYearOfferings.filter(co => co.offering_category_id === category.id)
    return {
      ...category,
      commitmentCount: commitments.length,
      isMonthly: category.is_monthly,
      specificMonth: category.month
    }
  })

  // Monthly vs One-time breakdown
  const monthlyCommitments = currentYearOfferings.filter(co => co.is_monthly).length
  const oneTimeCommitments = currentYearOfferings.filter(co => !co.is_monthly).length

  // Member engagement analysis
  const givingMembers = memberGivingData.filter(m => 
    currentYearCommitments.some(c => c.member_id === m.id)
  )

  const employmentBreakdown = {
    employed: givingMembers.filter(m => m.employment_status === 'Employed').length,
    unemployed: givingMembers.filter(m => m.employment_status === 'Unemployed').length,
    student: givingMembers.filter(m => m.employment_status === 'Student').length,
    retired: givingMembers.filter(m => m.employment_status === 'Retired').length,
    selfEmployed: givingMembers.filter(m => m.employment_status === 'Self-employed').length,
  }

  const tenureBreakdown = {
    new: givingMembers.filter(m => m.years_in_church && m.years_in_church <= 1).length,
    established: givingMembers.filter(m => m.years_in_church && m.years_in_church > 1 && m.years_in_church <= 5).length,
    longTerm: givingMembers.filter(m => m.years_in_church && m.years_in_church > 5).length,
  }

  // Geographic distribution of givers
  const cities = new Set(givingMembers.map(m => m.city).filter(Boolean))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <DollarSign className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stewardship Analytics</h1>
          <p className="text-muted-foreground text-sm">Analyze faith promise giving patterns and financial stewardship.</p>
        </div>
      </div>

      {/* Overall Stewardship KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-t-4 border-t-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commitments</CardTitle>
            <div className="h-8 w-8 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Target className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentYearCommitmentCount}</div>
            <p className="text-xs text-muted-foreground mt-1">For {currentYear}</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participation Rate</CardTitle>
            <div className="h-8 w-8 bg-green-500/10 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{participationRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Of {totalMemberCount} members</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">YoY Growth</CardTitle>
            <div className="h-8 w-8 bg-purple-500/10 rounded-full flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{yearOverYearGrowth > 0 ? '+' : ''}{yearOverYearGrowth}%</div>
            <p className="text-xs text-muted-foreground mt-1">vs {previousYear}</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Giving</CardTitle>
            <div className="h-8 w-8 bg-amber-500/10 rounded-full flex items-center justify-center">
              <Calendar className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{monthlyCommitments}</div>
            <p className="text-xs text-muted-foreground mt-1">Recurring commitments</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-cyan-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">One-Time Giving</CardTitle>
            <div className="h-8 w-8 bg-cyan-500/10 rounded-full flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-cyan-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{oneTimeCommitments}</div>
            <p className="text-xs text-muted-foreground mt-1">Special commitments</p>
          </CardContent>
        </Card>
      </div>

      {/* Stewardship Details */}
      <StewardshipClient 
        categoryAnalysis={categoryAnalysis}
        employmentBreakdown={employmentBreakdown}
        tenureBreakdown={tenureBreakdown}
        geographicReach={cities.size}
        givingMemberCount={givingMembers.length}
        currentYearData={currentYearCommitments}
        previousYearData={previousYearCommitments}
      />
    </div>
  )
}