"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Droplets,
  MapPin,
  Activity,
  Target,
  Church,
  HeartPulse,
  Briefcase,
  GraduationCap,
  ShieldAlert,
  FileSpreadsheet,
} from "lucide-react";
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
  const router = useRouter();
  const [data] = useState<ReportMember[]>(initialData);
  const [ministryParticipation] = useState<MinistryParticipation[]>(ministryData);
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

  // Click Handlers for Interactive Filtering
  const handleGenderClick = (entry: any) => {
    if (!entry || !entry.name) return;
    router.push(`/members?gender=${encodeURIComponent(entry.name)}`);
  };

  const handleMaritalClick = (entry: any) => {
    if (!entry || !entry.name) return;
    router.push(`/members?marital_status=${encodeURIComponent(entry.name)}`);
  };

  const handleAgeClick = (entry: any) => {
    if (!entry || !entry.name) return;
    const name = entry.name.toLowerCase();
    if (name.includes("kids")) router.push("/members?age_group=kids");
    else if (name.includes("teens")) router.push("/members?age_group=teens");
    else if (name.includes("young")) router.push("/members?age_group=young_adults");
    else if (name.includes("adults")) router.push("/members?age_group=adults");
    else if (name.includes("seniors")) router.push("/members?age_group=seniors");
  };

  const handleMinistryClick = (entry: any) => {
    if (!entry || !entry.name) return;
    router.push(`/members?ministry=${encodeURIComponent(entry.name)}`);
  };

  const handleMissionBranchClick = (entry: any) => {
    if (!entry || !entry.name) return;
    if (entry.name === "CBT Olongapo") {
      router.push("/members");
    } else {
      router.push(`/members?search=${encodeURIComponent(entry.name)}`);
    }
  };

  const handleResidenceCityClick = (entry: any) => {
    if (!entry || !entry.name) return;
    router.push(`/members?search=${encodeURIComponent(entry.name)}`);
  };

  // Top KPIs
  const totalMembers = filteredData.length;
  const baptizedMembers = filteredData.filter((m) => m.date_baptized).length;
  const maleCount = filteredData.filter(
    (m) => (m.gender || m.sex) === "Male"
  ).length;
  const femaleCount = filteredData.filter(
    (m) => (m.gender || m.sex) === "Female"
  ).length;
  const uniqueResidenceCities = new Set(
    filteredData.map((m) => m.city).filter(Boolean)
  ).size;
  const activeMissionBranches =
    new Set(filteredData.map((m) => m.mission_name).filter(Boolean)).size || 1;

  // Gender Data
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

  // Helper function to calculate age
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
      const age = m.age || calculateAge(m.birth_date || null);
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

  // Mission Church Branches
  const missionBranchData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((m) => {
      const branch = m.mission_name || "CBT Olongapo";
      counts[branch] = (counts[branch] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  // Member Residence City
  const residenceCityData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((m) => {
      const city = m.city || "Unspecified";
      counts[city] = (counts[city] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredData]);

  // 🏥 Health & Medical Analytics Data
  const bloodTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((m) => {
      const blood = (m.blood_type || "Unspecified").toUpperCase();
      counts[blood] = (counts[blood] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const allergyData = useMemo(() => {
    let hasAllergies = 0;
    let noAllergies = 0;
    filteredData.forEach((m) => {
      const text = (m.allergies || "").trim().toLowerCase();
      if (text !== "" && text !== "none" && text !== "n/a") {
        hasAllergies++;
      } else {
        noAllergies++;
      }
    });
    return [
      { name: "Known Allergies", value: hasAllergies },
      { name: "No Known Allergies", value: noAllergies },
    ].filter((d) => d.value > 0);
  }, [filteredData]);

  const emergencyReadinessPercent = useMemo(() => {
    if (!totalMembers) return 0;
    const count = filteredData.filter(
      (m) => m.emergency_contact_number && m.emergency_contact_number.trim() !== ""
    ).length;
    return Math.round((count / totalMembers) * 100);
  }, [filteredData, totalMembers]);

  // 💼 Labor, Career & Education Analytics Data
  const employmentData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((m) => {
      const status = m.employment_status || "Unspecified";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const eduData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((m) => {
      const edu = m.highest_educational_attainment || "Unspecified";
      counts[edu] = (counts[edu] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredData]);

  const occupationData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((m) => {
      if (m.occupation && m.occupation.trim() !== "") {
        const occ = m.occupation.trim();
        counts[occ] = (counts[occ] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredData]);

  // Ministry Stats
  const ministryStats = useMemo(() => {
    const filteredMinistryData = ministryParticipation.filter((mp) =>
      filteredData.some((m) => m.id === mp.member_id)
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

  const membersEngagedInMinistries = useMemo(() => {
    const engagedMemberIds = new Set(
      ministryParticipation
        .filter((mp) => filteredData.some((m) => m.id === mp.member_id))
        .map((mp) => mp.member_id)
    );
    return engagedMemberIds.size;
  }, [filteredData, ministryParticipation]);

  // Faith Promise Analytics
  const faithPromiseStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentYearPromises = faithPromises.filter(
      (fp) => fp.year === currentYear
    );

    const filteredPromises = currentYearPromises.filter((fp) =>
      filteredData.some((m) => m.id === fp.member_id)
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
            Explore church demographics, health preparedness, labor, and generate custom exports.
          </p>
        </div>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="h-10 rounded-lg border border-input bg-card text-foreground px-4 shadow-sm w-full sm:w-auto font-medium"
        >
          <option value="all">All-Time Data</option>
          <option value="this_year">Members Joined This Year</option>
          <option value="last_year">Members Joined Last Year</option>
        </select>
      </div>

      {/* Main Tabbed Analytics Dashboard */}
      <Tabs defaultValue="demographics" className="w-full space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="demographics" className="gap-2">
            <Users className="h-4 w-4" /> Demographics & Locations
          </TabsTrigger>
          <TabsTrigger value="health" className="gap-2">
            <HeartPulse className="h-4 w-4" /> Health & Emergency
          </TabsTrigger>
          <TabsTrigger value="labor" className="gap-2">
            <Briefcase className="h-4 w-4" /> Career & Education
          </TabsTrigger>
          <TabsTrigger value="ministry" className="gap-2">
            <Target className="h-4 w-4" /> Ministry & Pledges
          </TabsTrigger>
          <TabsTrigger value="raw" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Raw Export Table
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Demographics & Locations */}
        <TabsContent value="demographics" className="space-y-6">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            <Link href="/members" className="block group">
              <Card className="border-t-4 border-t-blue-500 shadow-sm hover:shadow-md transition-all cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium group-hover:text-blue-600 transition-colors">
                    Total Members
                  </CardTitle>
                  <div className="h-8 w-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalMembers}</div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/members?baptized=true" className="block group">
              <Card className="border-t-4 border-t-green-500 shadow-sm hover:shadow-md transition-all cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium group-hover:text-green-600 transition-colors">
                    Baptized Ratio
                  </CardTitle>
                  <div className="h-8 w-8 bg-green-500/10 rounded-full flex items-center justify-center">
                    <Droplets className="h-4 w-4 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {totalMembers ? Math.round((baptizedMembers / totalMembers) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    {baptizedMembers} baptized members →
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/members?gender=Female" className="block group">
              <Card className="border-t-4 border-t-pink-500 shadow-sm hover:shadow-md transition-all cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium group-hover:text-pink-600 transition-colors">
                    Gender Split
                  </CardTitle>
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
            </Link>

            <Link href="/missions" className="block group">
              <Card className="border-t-4 border-t-amber-500 shadow-sm hover:shadow-md transition-all cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium group-hover:text-amber-600 transition-colors">
                    Mission Outreaches
                  </CardTitle>
                  <div className="h-8 w-8 bg-amber-500/10 rounded-full flex items-center justify-center">
                    <Church className="h-4 w-4 text-amber-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{activeMissionBranches}</div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    Active mission branches →
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Card className="border-t-4 border-t-orange-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Residence Cities</CardTitle>
                <div className="h-8 w-8 bg-orange-500/10 rounded-full flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{uniqueResidenceCities}</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Member home cities</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <Card className="col-span-1 min-w-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Gender Distribution</CardTitle>
                <CardDescription className="text-xs">Click slice to view members →</CardDescription>
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
                      className="cursor-pointer"
                      onClick={handleGenderClick}
                    >
                      {genderData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Members"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-1 md:col-span-1 xl:col-span-2 min-w-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Marital Status</CardTitle>
                <CardDescription className="text-xs">Click bar to view members →</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={maritalData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} contentStyle={{ borderRadius: "8px" }} />
                    <Bar
                      dataKey="value"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                      name="Members"
                      className="cursor-pointer"
                      onClick={handleMaritalClick}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-1 md:col-span-2 min-w-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Age Demographics</CardTitle>
                <CardDescription className="text-xs">Click bar to view members →</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageData} margin={{ top: 20, right: 30, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} contentStyle={{ borderRadius: "8px" }} />
                    <Bar
                      dataKey="count"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      name="Members"
                      className="cursor-pointer"
                      onClick={handleAgeClick}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-1 md:col-span-2 min-w-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Mission Church Branches & Outreaches</CardTitle>
                <CardDescription className="text-xs">
                  Member count by assigned church mission branch / outreach
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={missionBranchData} margin={{ top: 20, right: 30, left: 0, bottom: 35 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={50} />
                    <YAxis allowDecimals={false} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} contentStyle={{ borderRadius: "8px" }} />
                    <Bar
                      dataKey="count"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                      name="Members"
                      className="cursor-pointer"
                      onClick={handleMissionBranchClick}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-1 md:col-span-2 min-w-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Member Residence (City/Municipality)</CardTitle>
                <CardDescription className="text-xs">Geographic distribution of member home addresses</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={residenceCityData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} contentStyle={{ borderRadius: "8px" }} />
                    <Bar
                      dataKey="count"
                      fill="#06b6d4"
                      radius={[0, 4, 4, 0]}
                      name="Members"
                      className="cursor-pointer"
                      onClick={handleResidenceCityClick}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: Health & Emergency Preparedness */}
        <TabsContent value="health" className="space-y-6">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-t-4 border-t-red-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Emergency Readiness</CardTitle>
                <div className="h-8 w-8 bg-red-500/10 rounded-full flex items-center justify-center">
                  <ShieldAlert className="h-4 w-4 text-red-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{emergencyReadinessPercent}%</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  Members with emergency contact on file
                </p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-rose-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Blood Donor Pool</CardTitle>
                <div className="h-8 w-8 bg-rose-500/10 rounded-full flex items-center justify-center">
                  <HeartPulse className="h-4 w-4 text-rose-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {filteredData.filter((m) => m.blood_type && m.blood_type.trim() !== "").length}
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  Members with blood type specified
                </p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-amber-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dietary & Allergy Alerts</CardTitle>
                <div className="h-8 w-8 bg-amber-500/10 rounded-full flex items-center justify-center">
                  <Activity className="h-4 w-4 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {allergyData.find((d) => d.name === "Known Allergies")?.value || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  Members requiring allergy accommodations at retreats
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Blood Type Distribution</CardTitle>
                <CardDescription className="text-xs">
                  Crucial for emergency church blood drives & hospital support
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bloodTypeData} margin={{ top: 20, right: 30, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} contentStyle={{ borderRadius: "8px" }} />
                    <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} name="Members" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Allergy & Health Safety Overview</CardTitle>
                <CardDescription className="text-xs">
                  Retreat, youth camp, and fellowship meal safety ratio
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allergyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {allergyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "#f59e0b" : "#10b981"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Members"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: Career & Education */}
        <TabsContent value="labor" className="space-y-6">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-t-4 border-t-purple-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Workforce Employed</CardTitle>
                <div className="h-8 w-8 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {filteredData.filter((m) => (m.employment_status || "").toLowerCase().includes("employ")).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Employed or self-employed members</p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-cyan-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Student Community</CardTitle>
                <div className="h-8 w-8 bg-cyan-500/10 rounded-full flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-cyan-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {filteredData.filter((m) => (m.employment_status || "").toLowerCase() === "student").length}
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Students pursuing education</p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-indigo-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Higher Education Ratio</CardTitle>
                <div className="h-8 w-8 bg-indigo-500/10 rounded-full flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-indigo-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {totalMembers
                    ? Math.round(
                        (filteredData.filter((m) =>
                          ["College", "Postgraduate"].includes(m.highest_educational_attainment || "")
                        ).length /
                          totalMembers) *
                          100
                      )
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">College degree or higher</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Employment Status</CardTitle>
                <CardDescription className="text-xs">Labor force breakdown of congregation</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={employmentData} margin={{ top: 20, right: 30, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={50} />
                    <YAxis allowDecimals={false} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} contentStyle={{ borderRadius: "8px" }} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Members" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Educational Attainment</CardTitle>
                <CardDescription className="text-xs">Highest degree completed</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eduData} margin={{ top: 20, right: 30, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={50} />
                    <YAxis allowDecimals={false} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} contentStyle={{ borderRadius: "8px" }} />
                    <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Members" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm md:col-span-2 xl:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Top Professional Fields</CardTitle>
                <CardDescription className="text-xs">Top occupations & skillsets</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupationData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} contentStyle={{ borderRadius: "8px" }} />
                    <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} name="Members" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 4: Ministry & Faith Promises */}
        <TabsContent value="ministry" className="space-y-6">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Ministry Participation</CardTitle>
                <CardDescription className="text-xs">Top ministries by member engagement</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ministryStats} margin={{ top: 20, right: 30, left: 0, bottom: 35 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={50} />
                    <YAxis allowDecimals={false} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} contentStyle={{ borderRadius: "8px" }} />
                    <Bar
                      dataKey="count"
                      fill="#0891b2"
                      radius={[4, 4, 0, 0]}
                      name="Members"
                      className="cursor-pointer"
                      onClick={handleMinistryClick}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Faith Promise Categories</CardTitle>
                <CardDescription className="text-xs">Commitment categories for giving this year</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={faithPromiseStats.categories} margin={{ top: 20, right: 30, left: 0, bottom: 35 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={50} />
                    <YAxis allowDecimals={false} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} contentStyle={{ borderRadius: "8px" }} />
                    <Bar dataKey="count" fill="#e11d48" radius={[4, 4, 0, 0]} name="Commitments" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 5: Raw Data & Custom CSV Export */}
        <TabsContent value="raw" className="space-y-6">
          <Card className="min-w-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle>Raw Data & Export</CardTitle>
              <CardDescription>
                Filter, sort, and select columns below. The exported CSV will match exactly what you configure here.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 bg-card/50">
              <ReportsDataTable columns={columns} data={filteredData} filename="cbt-directory-report.csv" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
