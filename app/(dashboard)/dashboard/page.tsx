import { db } from "@/db"
import { members, ministries, commitments, member_ministries } from "@/db/schema"
import { eq, isNotNull, desc, sql, gte, count } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, FileText, Activity, Droplets, HeartHandshake, CheckCircle, TrendingUp, Target } from "lucide-react"
import Link from "next/link"
import { DashboardCharts } from "@/components/dashboard/DashboardCharts"
import { RecentMembersTable } from "@/components/dashboard/RecentMembersTable"

export default async function DashboardPage() {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const currentYear = new Date().getFullYear()
  const previousYear = currentYear - 1

  // Fetch counts and data in parallel
  const [
    totalMembersResult,
    totalBaptizedResult,
    totalMinistriesResult,
    currentYearCommitmentsResult,
    recentMembers,
    growthDataQuery,
    ageDataQuery,
    ministryEngagementResult,
    previousYearGrowthQuery
  ] = await Promise.all([
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(members),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(members).where(isNotNull(members.date_baptized)),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(ministries),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(commitments).where(eq(commitments.year, currentYear)),
    db.select({
      id: members.id,
      first_name: members.first_name,
      last_name: members.last_name,
      contact_number: members.contact_number,
      city: members.city,
      created_at: members.created_at
    }).from(members).orderBy(desc(members.created_at)).limit(5),
    db.select({ created_at: members.created_at })
      .from(members)
      .where(gte(members.created_at, sixMonthsAgo)),
    db.select({ age: members.age }).from(members),
    db.select({ count: sql<number>`cast(count(distinct member_id) as int)` })
      .from(member_ministries),
    db.select({ created_at: members.created_at })
      .from(members)
      .where(sql`${members.created_at} >= (date_trunc('month', current_date - interval '12 months')) AND ${members.created_at} < (date_trunc('month', current_date - interval '6 months'))`)
  ])

  const totalMembers = totalMembersResult[0]?.count || 0
  const totalBaptized = totalBaptizedResult[0]?.count || 0
  const totalMinistries = totalMinistriesResult[0]?.count || 0
  const totalCommitments = currentYearCommitmentsResult[0]?.count || 0
  const ministryEngagedMembers = ministryEngagementResult[0]?.count || 0

  // Baptism Status Data
  const baptismData = [
    { name: 'Baptized', value: totalBaptized },
    { name: 'Unbaptized', value: totalMembers - totalBaptized },
  ]

  // Calculate Age Demographics
  let kids = 0, youth = 0, youngAdults = 0, adults = 0, seniors = 0;
  ageDataQuery.forEach(member => {
    const age = member.age
    if (age !== null && age !== undefined) {
      if (age <= 12) kids++
      else if (age <= 17) youth++
      else if (age <= 35) youngAdults++
      else if (age <= 55) adults++
      else seniors++
    }
  })

  const ageDemographicsData = [
    { name: 'Kids (0-12)', value: kids },
    { name: 'Youth (13-17)', value: youth },
    { name: 'Young Adults (18-35)', value: youngAdults },
    { name: 'Adults (36-55)', value: adults },
    { name: 'Seniors (55+)', value: seniors },
  ]

  // Format Monthly Growth Data for Area Chart with Year-over-Year Comparison
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const monthlyData: { month: string, currentYear: number, previousYear: number, monthNum: number }[] = []
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    monthlyData.push({ 
      month: months[d.getMonth()], 
      currentYear: 0, 
      previousYear: 0,
      monthNum: d.getMonth() 
    })
  }

  // Current year data
  growthDataQuery.forEach(member => {
    if (member.membership_date) {
      const mDate = new Date(member.membership_date)
      const m = mDate.getMonth()
      const y = mDate.getFullYear()
      const bucket = monthlyData.find(b => b.monthNum === m && y === currentYear)
      if (bucket) {
        bucket.currentYear++
      }
    }
  })

  // Previous year data
  previousYearGrowthQuery.forEach(member => {
    if (member.membership_date) {
      const mDate = new Date(member.membership_date)
      const m = mDate.getMonth()
      const y = mDate.getFullYear()
      const bucket = monthlyData.find(b => b.monthNum === m && y === previousYear)
      if (bucket) {
        bucket.previousYear++
      }
    }
  })

  // Format Current Date for Hero Section
  const currentDate = new Date().toLocaleDateString(undefined, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-10 border shadow-sm">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome Back! 👋</h1>
            <p className="text-muted-foreground font-medium">
              Today is {currentDate}. Here's what's happening in your church.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-all">
              <Link href="/members/new"><UserPlus className="mr-2 h-4 w-4" /> Add Member</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="bg-background/50 backdrop-blur-sm">
              <Link href="/reports"><FileText className="mr-2 h-4 w-4" /> Reports</Link>
            </Button>
          </div>
        </div>
        {/* Decorative background blob */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-md border-t-4 border-t-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <div className="h-8 w-8 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Registered in the database</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-md border-t-4 border-t-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{currentYear} Commitments</CardTitle>
            <div className="h-8 w-8 bg-purple-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-baseline gap-2">
              <span className="text-purple-600">{totalCommitments}</span>
              <span className="text-lg text-muted-foreground font-normal">/ {totalMembers}</span>
            </div>
            <div className="mt-3 h-2 w-full bg-secondary rounded-full overflow-hidden flex">
              <div 
                className="bg-purple-500 h-full transition-all" 
                style={{ width: `${totalMembers ? Math.round((totalCommitments / totalMembers) * 100) : 0}%` }} 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-md border-t-4 border-t-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Baptized Members</CardTitle>
            <div className="h-8 w-8 bg-green-500/10 rounded-full flex items-center justify-center">
              <Droplets className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalBaptized}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              <span className="text-green-500 font-semibold">{totalMembers ? Math.round((totalBaptized / totalMembers) * 100) : 0}%</span> of total members
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-md border-t-4 border-t-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Ministries</CardTitle>
            <div className="h-8 w-8 bg-amber-500/10 rounded-full flex items-center justify-center">
              <HeartHandshake className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalMinistries}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Available to join</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-md border-t-4 border-t-cyan-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ministry Engagement</CardTitle>
            <div className="h-8 w-8 bg-cyan-500/10 rounded-full flex items-center justify-center">
              <Target className="h-4 w-4 text-cyan-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalMembers ? Math.round((ministryEngagedMembers / totalMembers) * 100) : 0}%</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{ministryEngagedMembers} members serving</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-md border-t-4 border-t-rose-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giving Participation</CardTitle>
            <div className="h-8 w-8 bg-rose-500/10 rounded-full flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalMembers ? Math.round((totalCommitments / totalMembers) * 100) : 0}%</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Faith promise commitment</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <DashboardCharts 
        monthlyData={monthlyData} 
        churchRoleData={churchRoleDistribution} 
        ageData={ageDemographicsData} 
      />

      {/* Recent Members Table */}
      <RecentMembersTable recentMembers={recentMembers.map(m => ({...m, membership_date: m.membership_date}))} />
    </div>
  )
}
