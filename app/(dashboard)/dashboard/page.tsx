import { db } from "@/db";
import {
  members,
  ministries,
  commitments,
  member_ministries,
  attendance_sessions,
} from "@/db/schema";
import { eq, isNotNull, desc, sql, gte, count, or } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserPlus,
  FileText,
  Activity,
  Droplets,
  HeartHandshake,
  CheckCircle,
  TrendingUp,
  Target,
  CalendarCheck,
  Cake,
} from "lucide-react";
import Link from "next/link";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { RecentMembersTable } from "@/components/dashboard/RecentMembersTable";
import { UpcomingBirthdaysCard, AnniversaryCelebrant } from "@/components/dashboard/UpcomingBirthdaysCard";
import { RecentAttendanceCard, LatestServiceAttendance } from "@/components/dashboard/RecentAttendanceCard";
import { formatName, formatAnniversaryMilestone } from "@/lib/utils/utils";

export const revalidate = 0

export default async function DashboardPage() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  // Fetch counts and data in parallel
  const [
    totalMembersResult,
    newMembersThisMonthResult,
    newBaptismsResult,
    recentMembers,
    growthDataQuery,
    celebrationMembersQuery,
    ministryEngagementResult,
    previousYearGrowthQuery,
    attendanceResult,
    recentSessionsResult,
  ] = await Promise.all([
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(members),
    db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(members)
      .where(
        sql`EXTRACT(MONTH FROM COALESCE(${members.membership_date}, ${members.created_at})) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM COALESCE(${members.membership_date}, ${members.created_at})) = EXTRACT(YEAR FROM CURRENT_DATE)`
      ),
    db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(members)
      .where(sql`EXTRACT(YEAR FROM ${members.date_baptized}) = ${currentYear}`),
    db
      .select({
        id: members.id,
        first_name: members.first_name,
        last_name: members.last_name,
        contact_number: members.contact_number,
        city: members.city,
        membership_date: members.created_at,
      })
      .from(members)
      .orderBy(desc(members.created_at))
      .limit(5),
    db
      .select({
        membership_date: sql`COALESCE(${members.membership_date}, ${members.created_at})`,
      })
      .from(members)
      .where(
        gte(
          sql`COALESCE(${members.membership_date}, ${members.created_at})`,
          sixMonthsAgo,
        ),
      ),
    db
      .select({
        id: members.id,
        first_name: members.first_name,
        last_name: members.last_name,
        birth_date: members.birth_date,
        marital_status: members.marital_status,
        spouse_name: members.spouse_name,
        spouse_member_id: members.spouse_member_id,
        anniversary_date: members.anniversary_date,
        contact_number: members.contact_number,
      })
      .from(members)
      .where(
        or(
          isNotNull(members.birth_date),
          isNotNull(members.anniversary_date),
          eq(members.marital_status, "Married")
        )
      ),
    db
      .select({ count: sql<number>`cast(count(distinct member_id) as int)` })
      .from(member_ministries),
    db
      .select({
        membership_date: sql`COALESCE(${members.membership_date}, ${members.created_at})`,
      })
      .from(members)
      .where(
        sql`${sql`COALESCE(${members.membership_date}, ${members.created_at})`} >= (date_trunc('month', current_date - interval '12 months')) AND ${sql`COALESCE(${members.membership_date}, ${members.created_at})`} < (date_trunc('month', current_date - interval '6 months'))`,
      ),
    db
      .select({
        present: sql<number>`COALESCE(sum(${attendance_sessions.present_count}), 0)::int`,
        total: sql<number>`COALESCE(sum(${attendance_sessions.total_enrolled}), 0)::int`,
      })
      .from(attendance_sessions),
    db
      .select({
        id: attendance_sessions.id,
        ministry_id: attendance_sessions.ministry_id,
        ministry_name: ministries.name,
        date: attendance_sessions.date,
        service_time: attendance_sessions.service_time,
        present_count: attendance_sessions.present_count,
        total_enrolled: attendance_sessions.total_enrolled,
        weather_condition: attendance_sessions.weather_condition,
        weather_summary: attendance_sessions.weather_summary,
        weather_temp_c: attendance_sessions.weather_temp_c,
        weather_icon: attendance_sessions.weather_icon,
      })
      .from(attendance_sessions)
      .innerJoin(ministries, eq(attendance_sessions.ministry_id, ministries.id))
      .orderBy(desc(attendance_sessions.date), desc(attendance_sessions.created_at))
      .limit(10),
  ]);

  const totalMembers = totalMembersResult[0]?.count || 0;
  const newMembersThisMonth = newMembersThisMonthResult[0]?.count || 0;
  const newBaptismsThisYear = newBaptismsResult[0]?.count || 0;
  const ministryEngagedMembers = ministryEngagementResult[0]?.count || 0;
  const attPresent = attendanceResult[0]?.present || 0;
  const attTotal = attendanceResult[0]?.total || 1;
  const attPct = attendanceResult[0]?.total ? Math.min(100, Math.round((attPresent / attTotal) * 100)) : 0;

  // Process Latest Service Attendance Snapshot
  let latestServiceData: LatestServiceAttendance | null = null;
  if (recentSessionsResult && recentSessionsResult.length > 0) {
    const latestSession = recentSessionsResult[0];
    const targetDate = latestSession.date;
    const targetSlot = latestSession.service_time || "AM";

    const matchingSessions = recentSessionsResult.filter(
      (s) => s.date === targetDate && (s.service_time || "AM") === targetSlot
    );

    const totalPresent = matchingSessions.reduce((sum, s) => sum + (s.present_count || 0), 0);
    const totalEnrolled = matchingSessions.reduce((sum, s) => sum + (s.total_enrolled || 0), 0);
    const percentage = totalEnrolled > 0 ? Math.min(100, Math.round((totalPresent / totalEnrolled) * 100)) : 0;

    latestServiceData = {
      date: targetDate,
      serviceTime: targetSlot,
      weatherCondition: latestSession.weather_condition,
      weatherSummary: latestSession.weather_summary,
      weatherTempC: latestSession.weather_temp_c,
      weatherIcon: latestSession.weather_icon,
      totalPresent,
      totalEnrolled,
      percentage,
      fellowships: matchingSessions.map((s) => ({
        ministryId: s.ministry_id,
        ministryName: s.ministry_name,
        presentCount: s.present_count || 0,
        totalEnrolled: s.total_enrolled || 0,
        percentage: s.total_enrolled > 0 ? Math.min(100, Math.round(((s.present_count || 0) / s.total_enrolled) * 100)) : 0,
      })),
    };
  }

  // Birthday Celebrants calculation
  const now = new Date();
  const currentMonth = now.getMonth() + 1;

  const validBirthdayMembers = celebrationMembersQuery.filter((m) => Boolean(m.birth_date)) as {
    id: string;
    first_name: string;
    last_name: string;
    birth_date: string;
    contact_number: string | null;
  }[];

  const celebrantsThisMonth = validBirthdayMembers.filter((m) => {
    const parts = String(m.birth_date).split("T")[0].split("-");
    if (parts.length === 3) {
      return parseInt(parts[1], 10) === currentMonth;
    }
    const d = new Date(m.birth_date);
    return !isNaN(d.getTime()) && d.getMonth() + 1 === currentMonth;
  });

  const upcoming30Days = validBirthdayMembers
    .map((m) => {
      const parts = String(m.birth_date).split("T")[0].split("-");
      let bMonth = -1;
      let bDay = -1;
      if (parts.length === 3) {
        bMonth = parseInt(parts[1], 10);
        bDay = parseInt(parts[2], 10);
      } else {
        const d = new Date(m.birth_date);
        if (!isNaN(d.getTime())) {
          bMonth = d.getMonth() + 1;
          bDay = d.getDate();
        }
      }
      if (bMonth === -1) return null;

      const thisYearBday = new Date(now.getFullYear(), bMonth - 1, bDay);
      if (thisYearBday < now && Math.abs(now.getDate() - bDay) > 0) {
        thisYearBday.setFullYear(now.getFullYear() + 1);
      }
      const diffTime = thisYearBday.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 30) {
        return { ...m, diffDays };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.diffDays - b.diffDays) as {
      id: string;
      first_name: string;
      last_name: string;
      birth_date: string;
      contact_number: string | null;
    }[];

  // Wedding Anniversaries calculation & couple deduplication
  const validAnniversaryMembers = celebrationMembersQuery.filter((m) => Boolean(m.anniversary_date));
  const processedCoupleIds = new Set<string>();
  const coupleAnniversaries: AnniversaryCelebrant[] = [];

  validAnniversaryMembers.forEach((member) => {
    if (processedCoupleIds.has(member.id)) return;

    let coupleName = "";
    const memberName = formatName(`${member.first_name} ${member.last_name}`);

    // Check if spouse is a registered member in the database
    if (member.spouse_member_id) {
      const spouseMember = validAnniversaryMembers.find((m) => m.id === member.spouse_member_id);
      if (spouseMember) {
        processedCoupleIds.add(spouseMember.id);
        const spouseFormatted = formatName(`${spouseMember.first_name} ${spouseMember.last_name}`);
        if (member.last_name && spouseMember.last_name && member.last_name.toLowerCase().trim() === spouseMember.last_name.toLowerCase().trim()) {
          coupleName = `${formatName(member.first_name)} & ${formatName(spouseMember.first_name)} ${formatName(member.last_name)}`;
        } else {
          coupleName = `${memberName} & ${spouseFormatted}`;
        }
      }
    }

    if (!coupleName) {
      if (member.spouse_name && member.spouse_name.trim()) {
        const spouseFormatted = formatName(member.spouse_name);
        if (member.last_name && spouseFormatted.toLowerCase().includes(member.last_name.toLowerCase())) {
          coupleName = `${formatName(member.first_name)} & ${spouseFormatted}`;
        } else {
          coupleName = `${memberName} & ${spouseFormatted}`;
        }
      } else {
        coupleName = `${memberName} & Spouse`;
      }
    }

    processedCoupleIds.add(member.id);
    const milestone = formatAnniversaryMilestone(member.anniversary_date);

    coupleAnniversaries.push({
      id: member.id,
      spouse_member_id: member.spouse_member_id,
      couple_name: coupleName,
      anniversary_date: member.anniversary_date!,
      milestone,
      contact_number: member.contact_number,
    });
  });

  const anniversariesThisMonth = coupleAnniversaries.filter((a) => {
    const parts = String(a.anniversary_date).split("T")[0].split("-");
    if (parts.length === 3) {
      return parseInt(parts[1], 10) === currentMonth;
    }
    const d = new Date(a.anniversary_date);
    return !isNaN(d.getTime()) && d.getMonth() + 1 === currentMonth;
  });

  const upcomingAnniversaries30Days = coupleAnniversaries
    .map((a) => {
      const parts = String(a.anniversary_date).split("T")[0].split("-");
      let bMonth = -1;
      let bDay = -1;
      if (parts.length === 3) {
        bMonth = parseInt(parts[1], 10);
        bDay = parseInt(parts[2], 10);
      } else {
        const d = new Date(a.anniversary_date);
        if (!isNaN(d.getTime())) {
          bMonth = d.getMonth() + 1;
          bDay = d.getDate();
        }
      }
      if (bMonth === -1) return null;

      const thisYearAnn = new Date(now.getFullYear(), bMonth - 1, bDay);
      if (thisYearAnn < now && Math.abs(now.getDate() - bDay) > 0) {
        thisYearAnn.setFullYear(now.getFullYear() + 1);
      }
      const diffTime = thisYearAnn.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 30) {
        return { ...a, diffDays };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.diffDays - b.diffDays) as AnniversaryCelebrant[];

  // Process age demographics
  const ageDemographics = {
    kids: 0,
    teens: 0,
    youngAdults: 0,
    adults: 0,
    seniors: 0,
  };

  validBirthdayMembers.forEach((member) => {
    if (member.birth_date) {
      const birthDate = new Date(member.birth_date);
      if (!isNaN(birthDate.getTime())) {
        const age = new Date().getFullYear() - birthDate.getFullYear();
        if (age <= 12) ageDemographics.kids++;
        else if (age <= 17) ageDemographics.teens++;
        else if (age <= 35) ageDemographics.youngAdults++;
        else if (age <= 59) ageDemographics.adults++;
        else ageDemographics.seniors++;
      }
    }
  });

  const ageDemographicsData = [
    { name: "Kids (0-12)", value: ageDemographics.kids },
    { name: "Teens (13-17)", value: ageDemographics.teens },
    { name: "Young Adults (18-35)", value: ageDemographics.youngAdults },
    { name: "Adults (36-59)", value: ageDemographics.adults },
    { name: "Seniors (60+)", value: ageDemographics.seniors },
  ];

  // Format Monthly Growth Data for Area Chart with Year-over-Year Comparison
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthlyData: {
    month: string;
    currentYear: number;
    previousYear: number;
    monthNum: number;
  }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    monthlyData.push({
      month: months[d.getMonth()],
      currentYear: 0,
      previousYear: 0,
      monthNum: d.getMonth(),
    });
  }

  // Current year data
  growthDataQuery.forEach((member) => {
    if (member.membership_date) {
      const mDate = new Date(member.membership_date as any);
      const m = mDate.getMonth();
      const y = mDate.getFullYear();
      const bucket = monthlyData.find(
        (b) => b.monthNum === m && y === currentYear,
      );
      if (bucket) {
        bucket.currentYear++;
      }
    }
  });

  // Previous year data
  previousYearGrowthQuery.forEach((member) => {
    if (member.membership_date) {
      const mDate = new Date(member.membership_date as any);
      const m = mDate.getMonth();
      const y = mDate.getFullYear();
      const bucket = monthlyData.find(
        (b) => b.monthNum === m && y === previousYear,
      );
      if (bucket) {
        bucket.previousYear++;
      }
    }
  });

  const membershipStatusData = [
    { name: "Engaged in Ministry", value: ministryEngagedMembers },
    {
      name: "Not Yet Engaged",
      value: Math.max(0, totalMembers - ministryEngagedMembers),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border border-primary/20 p-6 md:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Activity className="h-3.5 w-3.5" />
              <span>Church Overview & Health</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Welcome back to CBT Database
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl">
              Monitor church demographics, ministry involvement, discipleship growth, and member engagement at a glance.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              size="lg"
              asChild
              className="shadow-sm"
            >
              <Link href="/members/new">
                <UserPlus className="mr-2 h-4 w-4" /> Add Member
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="bg-background/50 backdrop-blur-sm"
            >
              <Link href="/reports">
                <FileText className="mr-2 h-4 w-4" /> Reports
              </Link>
            </Button>
          </div>
        </div>
        {/* Decorative background blob */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      </div>

      {/* Streamlined KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Link href="/members" className="block group">
          <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-md border-t-4 border-t-blue-500 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-blue-600 transition-colors">Total Members</CardTitle>
              <div className="h-8 w-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalMembers}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                Total registered in database →
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/attendance" className="block group">
          <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-md border-t-4 border-t-emerald-500 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-emerald-600 transition-colors">Ministry Attendance</CardTitle>
              <div className="h-8 w-8 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <CalendarCheck className="h-4 w-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{attPct}%</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                Recorded turnout rate →
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/members?joined=this_month" className="block group">
          <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-md border-t-4 border-t-purple-500 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-purple-600 transition-colors">New Members This Month</CardTitle>
              <div className="h-8 w-8 bg-purple-500/10 rounded-full flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{newMembersThisMonth}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                Registered in current month →
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/members?birth_month=this_month" className="block group">
          <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-md border-t-4 border-t-pink-500 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-pink-600 transition-colors">Birthdays & Anniversaries</CardTitle>
              <div className="h-8 w-8 bg-pink-500/10 rounded-full flex items-center justify-center">
                <Cake className="h-4 w-4 text-pink-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{celebrantsThisMonth.length + anniversariesThisMonth.length}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {celebrantsThisMonth.length} Birthdays • {anniversariesThisMonth.length} Anniversaries →
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts Section */}
      <DashboardCharts
        monthlyData={monthlyData}
        membershipStatusData={membershipStatusData}
        ageData={ageDemographicsData}
      />

      {/* Attendance Snapshot & Upcoming Celebrants Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentAttendanceCard latestService={latestServiceData} />
        <UpcomingBirthdaysCard
          celebrantsThisMonth={celebrantsThisMonth}
          upcoming30Days={upcoming30Days}
          anniversariesThisMonth={anniversariesThisMonth}
          upcomingAnniversaries30Days={upcomingAnniversaries30Days}
        />
      </div>

      {/* Recent Members Table */}
      <RecentMembersTable
        recentMembers={recentMembers.map((m) => ({
          ...m,
          membership_date: m.membership_date
            ? new Date(m.membership_date as any)
            : null,
        }))}
      />
    </div>
  );
}

