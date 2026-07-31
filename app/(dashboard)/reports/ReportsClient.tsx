"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ReportsDataTable } from "@/components/reports/ReportsDataTable";
import { columns } from "./columns";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Users, Droplets, MapPin, Activity, Target } from "lucide-react";
import type { ReportMember } from "./page";

export type MinistryParticipation = {
  member_id: string;
  ministry_id: string;
  ministry_name: string | null;
};

export type FaithPromiseData = {
  member_id: string;
  year: number;
  offering_category_id: string | null;
  category_name: string | null;
  is_monthly: boolean | null;
};

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

export function ReportsClient({
  initialData,
  ministryData = [],
  faithPromiseData = [],
}: {
  initialData: ReportMember[];
  ministryData?: MinistryParticipation[];
  faithPromiseData?: FaithPromiseData[];
}) {
  const [data] = useState<ReportMember[]>(initialData);
  const [ministryParticipation] =
    useState<MinistryParticipation[]>(ministryData);
  const [faithPromises] = useState<FaithPromiseData[]>(faithPromiseData);

  // Date Filtering State
  const [dateFilter, setDateFilter] = useState("all"); // all, this_year, last_year

  const filteredData = useMemo(() => {
    if (dateFilter === "all") return data;
    const currentYear = new Date().getFullYear();
    return data.filter((m) => {
      if (!m.membership_date) return false;
      const mYear = new Date(m.membership_date).getFullYear();
      if (dateFilter === "this_year") return mYear === currentYear;
      if (dateFilter === "last_year") return mYear === currentYear - 1;
      return true;
    });
  }, [data, dateFilter]);

  // Top KPIs
  const totalMembers = filteredData.length;
  const baptizedMembers = filteredData.filter((m) => m.date_baptized).length;
  const maleCount = filteredData.filter(
    (m) => (m.gender || m.sex) === "Male",
  ).length;
  const femaleCount = filteredData.filter(
    (m) => (m.gender || m.sex) === "Female",
  ).length;
  const uniqueCities = new Set(
    filteredData
      .map((m) => (m as any).mission_location || m.city)
      .filter(Boolean),
  ).size;

  // Gender Data for Chart
  const genderData = [
    { name: "Male", value: maleCount },
    { name: "Female", value: femaleCount },
  ].filter((d) => d.value > 0);

  // Marital Status Data
  const maritalData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((m) => {
      const status = m.marital_status || "Unknown";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // Helper function to calculate age from birth_date
  const calculateAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    if (isNaN(birth.getTime())) return null;
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  // Age Groups Data
  const ageData = useMemo(() => {
    let kids = 0,
      youth = 0,
      youngAdults = 0,
      adults = 0,
      seniors = 0,
      unknown = 0;
    filteredData.forEach((m) => {
      const age = m.age || calculateAge((m as any).birth_date || null);
      if (age === null || age === undefined) {
        unknown++;
      } else {
        if (age <= 12) kids++;
        else if (age <= 17) youth++;
        else if (age <= 35) youngAdults++;
        else if (age <= 60) adults++;
        else seniors++;
      }
    });
    return [
      { name: "Kids (0-12)", count: kids },
      { name: "Youth (13-17)", count: youth },
      { name: "Young Adults (18-35)", count: youngAdults },
      { name: "Adults (36-55)", count: adults },
      { name: "Seniors (60+)", count: seniors },
      { name: "Unknown", count: unknown },
    ].filter((d) => d.count > 0);
  }, [filteredData]);

  // City Geographic Spread (using mission location first, then residence city)
  const cityData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((m) => {
      const city = (m as any).mission_location || m.city || "Unknown";
      counts[city] = (counts[city] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 cities
  }, [filteredData]);

  // Educational Attainment
  const eduData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((m) => {
      const edu = m.highest_educational_attainment || "Unknown";
      counts[edu] = (counts[edu] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredData]);

  // Ministry Participation Analysis
  const ministryStats = useMemo(() => {
    const filteredMinistryData = ministryParticipation.filter((mp) =>
      filteredData.some((m) => m.id === mp.member_id),
    );

    const ministryCounts: Record<string, number> = {};
    filteredMinistryData.forEach((mp) => {
      const name = mp.ministry_name || "Unknown Ministry";
      ministryCounts[name] = (ministryCounts[name] || 0) + 1;
    });

    return Object.entries(ministryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredData, ministryParticipation]);

  // Calculate unique members engaged in ministries
  const membersEngagedInMinistries = useMemo(() => {
    const engagedMemberIds = new Set(
      ministryParticipation
        .filter((mp) => filteredData.some((m) => m.id === mp.member_id))
        .map((mp) => mp.member_id),
    );
    return engagedMemberIds.size;
  }, [filteredData, ministryParticipation]);

  // Faith Promise Analytics
  const faithPromiseStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentYearPromises = faithPromises.filter(
      (fp) => fp.year === currentYear,
    );

    const filteredPromises = currentYearPromises.filter((fp) =>
      filteredData.some((m) => m.id === fp.member_id),
    );

    const categoryCounts: Record<string, number> = {};
    const monthlyCount = filteredPromises.filter((fp) => fp.is_monthly).length;
    const oneTimeCount = filteredPromises.filter((fp) => !fp.is_monthly).length;

    filteredPromises.forEach((fp) => {
      const category = fp.category_name || "Unknown Category";
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    return {
      totalCommitments: filteredPromises.length,
      monthly: monthlyCount,
      oneTime: oneTimeCount,
      categories: Object.entries(categoryCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
    };
  }, [filteredData, faithPromises]);

  return (
    <div className="space-y-6">
      {/* Header & Global Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Explore demographic data and generate custom reports.
          </p>
        </div>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="h-10 rounded-lg border border-input bg-card text-foreground px-4 shadow-sm w-full sm:w-auto"
        >
          <option value="all">All-Time Data</option>
          <option value="this_year">Members This Year</option>
          <option value="last_year">Members Last Year</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Card className="border-t-4 border-t-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <div className="h-8 w-8 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalMembers}</div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Baptized Ratio
            </CardTitle>
            <div className="h-8 w-8 bg-green-500/10 rounded-full flex items-center justify-center">
              <Droplets className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalMembers
                ? Math.round((baptizedMembers / totalMembers) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {baptizedMembers} baptized members
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-pink-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gender Split</CardTitle>
            <div className="h-8 w-8 bg-pink-500/10 rounded-full flex items-center justify-center">
              <Activity className="h-4 w-4 text-pink-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {maleCount}M / {femaleCount}F
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cities Reached
            </CardTitle>
            <div className="h-8 w-8 bg-amber-500/10 rounded-full flex items-center justify-center">
              <MapPin className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{uniqueCities}</div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-cyan-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ministry Engaged
            </CardTitle>
            <div className="h-8 w-8 bg-cyan-500/10 rounded-full flex items-center justify-center">
              <Target className="h-4 w-4 text-cyan-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalMembers
                ? Math.round((membersEngagedInMinistries / totalMembers) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {membersEngagedInMinistries} members engaged
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-rose-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Faith Promises
            </CardTitle>
            <div className="h-8 w-8 bg-rose-500/10 rounded-full flex items-center justify-center">
              <Droplets className="h-4 w-4 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {faithPromiseStats.totalCommitments}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {faithPromiseStats.monthly} monthly / {faithPromiseStats.oneTime}{" "}
              one-time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {/* Gender Distribution */}
        <Card className="col-span-1 min-w-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, "Members"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Marital Status */}
        <Card className="col-span-1 md:col-span-1 xl:col-span-2 min-w-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Marital Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={maritalData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  opacity={0.3}
                />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  contentStyle={{ borderRadius: "8px" }}
                />
                <Bar
                  dataKey="value"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                  name="Members"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Age Demographics */}
        <Card className="col-span-1 md:col-span-2 min-w-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Age Demographics</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ageData}
                margin={{ top: 20, right: 30, left: 0, bottom: 25 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  opacity={0.3}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  contentStyle={{ borderRadius: "8px" }}
                />
                <Bar
                  dataKey="count"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  name="Members"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Cities */}
        <Card className="col-span-1 min-w-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Top Cities</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cityData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  opacity={0.3}
                />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11 }}
                  width={80}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  contentStyle={{ borderRadius: "8px" }}
                />
                <Bar
                  dataKey="count"
                  fill="#f59e0b"
                  radius={[0, 4, 4, 0]}
                  name="Members"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ministry Participation Chart */}
      <Card className="min-w-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Ministry Participation</CardTitle>
          <CardDescription>Top ministries by member engagement</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={ministryStats}
              margin={{ top: 20, right: 30, left: 0, bottom: 35 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                opacity={0.3}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                angle={-25}
                textAnchor="end"
                height={50}
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                contentStyle={{ borderRadius: "8px" }}
              />
              <Bar
                dataKey="count"
                fill="#0891b2"
                radius={[4, 4, 0, 0]}
                name="Members"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Faith Promise Analytics */}
      <Card className="min-w-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Faith Promise Categories</CardTitle>
          <CardDescription>
            Commitment categories for giving this year
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={faithPromiseStats.categories}
              margin={{ top: 20, right: 30, left: 0, bottom: 35 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                opacity={0.3}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                angle={-25}
                textAnchor="end"
                height={50}
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                contentStyle={{ borderRadius: "8px" }}
              />
              <Bar
                dataKey="count"
                fill="#e11d48"
                radius={[4, 4, 0, 0]}
                name="Commitments"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Educational Attainment (Full Width) */}
      <Card className="min-w-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Educational Attainment</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={eduData}
              margin={{ top: 20, right: 30, left: 0, bottom: 35 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                opacity={0.3}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                angle={-25}
                textAnchor="end"
                height={50}
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                contentStyle={{ borderRadius: "8px" }}
              />
              <Bar
                dataKey="count"
                fill="#06b6d4"
                radius={[4, 4, 0, 0]}
                name="Members"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="min-w-0 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle>Raw Data & Export</CardTitle>
          <CardDescription>
            Filter, sort, and select columns below. The exported CSV will match
            exactly what you configure here.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 bg-card/50">
          <ReportsDataTable
            columns={columns}
            data={filteredData}
            filename="cbt-directory-report.csv"
          />
        </CardContent>
      </Card>
    </div>
  );
}
