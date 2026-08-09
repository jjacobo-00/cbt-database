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
import { Button } from "@/components/ui/button";
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
  Label,
} from "recharts";
import { useTheme } from "next-themes";
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
  CalendarCheck,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  UserCheck,
  Download,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { AreaChart, Area } from "recharts";
import type { ReportMember, ReportAttendanceSession } from "./page";
import { normalizeCity } from "@/lib/utils/utils";
import { formatServiceSlotBadge } from "@/lib/constants/church-schedule";

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

// Vivid palette — readable in both light and dark mode
const GENDER_COLORS = ["#6366f1", "#ec4899"];
const ALLERGY_COLORS = ["#f59e0b", "#10b981"];

// Glassmorphic Custom Bar Tooltip
const CustomTooltip = ({
  active,
  payload,
  label,
  total,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  total: number;
}) => {
  if (!active || !payload?.length) return null;
  const value = payload[0].value as number;
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
  const color = payload[0].fill || payload[0].color || "#6366f1";
  return (
    <div className="px-3.5 py-2.5 rounded-xl border border-border/60 bg-popover/95 backdrop-blur-md shadow-2xl min-w-[120px]">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
        <p className="text-xs font-semibold text-foreground truncate max-w-[160px]">{label}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-foreground">{value}</span>
        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">{pct}%</span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-0.5">members</p>
    </div>
  );
};

// Glassmorphic Pie Tooltip
const PieTooltip = ({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: any[];
  total: number;
}) => {
  if (!active || !payload?.length) return null;
  const { name, value, fill } = payload[0];
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
  return (
    <div className="px-3.5 py-2.5 rounded-xl border border-border/60 bg-popover/95 backdrop-blur-md shadow-2xl min-w-[130px]">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: fill }} />
        <p className="text-xs font-semibold text-foreground">{name}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-foreground">{value}</span>
        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">{pct}%</span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-0.5">members</p>
    </div>
  );
};

// Pill Legend for Donut Charts
const PillLegend = ({
  items,
}: {
  items: { name: string; color: string; value: number; total: number }[];
}) => (
  <div className="flex flex-wrap justify-center gap-2 mt-3">
    {items.map((item) => {
      const pct = item.total > 0 ? ((item.value / item.total) * 100).toFixed(1) : "0";
      return (
        <div key={item.name} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 text-xs font-medium">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: item.color }} />
          <span className="text-foreground">{item.name}</span>
          <span className="text-muted-foreground">{pct}%</span>
        </div>
      );
    })}
  </div>
);

// Donut Center Label (SVG-safe)
const DonutCenterLabel = ({
  viewBox,
  value,
  label,
}: {
  viewBox?: { cx: number; cy: number };
  value: number;
  label: string;
}) => {
  const cx = viewBox?.cx ?? 0;
  const cy = viewBox?.cy ?? 0;
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-0.4em" style={{ fontSize: "22px", fontWeight: 700 }}>
        {value}
      </tspan>
      <tspan x={cx} dy="1.5em" style={{ fontSize: "11px" }}>
        {label}
      </tspan>
    </text>
  );
};

export function ReportsClient({
  initialData,
  ministryData = [],
  faithPromiseData = [],
  attendanceData = [],
}: {
  initialData: ReportMember[];
  ministryData?: MinistryParticipation[];
  faithPromiseData?: FaithPromiseData[];
  attendanceData?: ReportAttendanceSession[];
}) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const tickColor = isDark ? "hsl(0 0% 65%)" : "hsl(0 0% 38%)";
  const gridColor = isDark ? "hsl(0 0% 22%)" : "hsl(0 0% 88%)";
  const cursorFill = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";

  const [data] = useState<ReportMember[]>(initialData);
  const [ministryParticipation] = useState<MinistryParticipation[]>(ministryData);
  const [faithPromises] = useState<FaithPromiseData[]>(faithPromiseData);
  const [dateFilter, setDateFilter] = useState("all");

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
    if (entry.name === "CBT Olongapo") router.push("/members");
    else router.push(`/members?search=${encodeURIComponent(entry.name)}`);
  };
  const handleResidenceCityClick = (entry: any) => {
    if (!entry || !entry.name || entry.name === "Unspecified") return;
    router.push(`/members?city=${encodeURIComponent(entry.name)}`);
  };
  const handleBloodTypeClick = (entry: any) => {
    if (!entry || !entry.name || entry.name === "UNSPECIFIED") return;
    router.push(`/members?blood_type=${encodeURIComponent(entry.name)}`);
  };
  const handleAllergyClick = (entry: any) => {
    if (!entry || !entry.name) return;
    if (entry.name === "Known Allergies") {
      router.push("/members?has_allergies=true");
    } else {
      router.push("/members?has_allergies=false");
    }
  };
  const handleEmploymentClick = (entry: any) => {
    if (!entry || !entry.name || entry.name === "Unspecified") return;
    router.push(`/members?employment=${encodeURIComponent(entry.name)}`);
  };
  const handleEducationClick = (entry: any) => {
    if (!entry || !entry.name || entry.name === "Unspecified") return;
    router.push(`/members?education=${encodeURIComponent(entry.name)}`);
  };
  const handleOccupationClick = (entry: any) => {
    if (!entry || !entry.name) return;
    router.push(`/members?search=${encodeURIComponent(entry.name)}`);
  };
  const handleFaithPromiseClick = (entry: any) => {
    router.push("/commitments");
  };

  const totalMembers = filteredData.length;
  const baptizedMembers = filteredData.filter((m) => m.date_baptized).length;
  const maleCount = filteredData.filter((m) => (m.gender || m.sex) === "Male").length;
  const femaleCount = filteredData.filter((m) => (m.gender || m.sex) === "Female").length;
  const uniqueResidenceCities = new Set(filteredData.map((m) => m.city).filter(Boolean)).size;
  const activeMissionBranches = new Set(filteredData.map((m) => m.mission_name).filter(Boolean)).size || 1;

  const genderData = [
    { name: "Male", value: maleCount },
    { name: "Female", value: femaleCount },
  ].filter((d) => d.value > 0);

  const maritalData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((m) => {
      const status = m.marital_status || "Unknown";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const calculateAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    if (isNaN(birth.getTime())) return null;
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 0 ? age : null;
  };

  const ageData = useMemo(() => {
    let kids = 0, youth = 0, youngAdults = 0, adults = 0, seniors = 0, unknown = 0;
    filteredData.forEach((m) => {
      const age = m.age || calculateAge(m.birth_date || null);
      if (age === null || age === undefined) unknown++;
      else if (age <= 12) kids++;
      else if (age <= 17) youth++;
      else if (age <= 35) youngAdults++;
      else if (age <= 60) adults++;
      else seniors++;
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

  const missionBranchData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((m) => {
      const branch = m.mission_name || "CBT Olongapo";
      counts[branch] = (counts[branch] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const residenceCityData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((m) => {
      const city = normalizeCity(m.city) || "Unspecified";
      counts[city] = (counts[city] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filteredData]);

  const bloodTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((m) => {
      const blood = (m.blood_type || "Unspecified").toUpperCase();
      counts[blood] = (counts[blood] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const allergyData = useMemo(() => {
    let hasAllergies = 0, noAllergies = 0;
    filteredData.forEach((m) => {
      const text = (m.allergies || "").trim().toLowerCase();
      if (text !== "" && text !== "none" && text !== "n/a") hasAllergies++;
      else noAllergies++;
    });
    return [
      { name: "Known Allergies", value: hasAllergies },
      { name: "No Known Allergies", value: noAllergies },
    ].filter((d) => d.value > 0);
  }, [filteredData]);

  const emergencyReadinessPercent = useMemo(() => {
    if (!totalMembers) return 0;
    const count = filteredData.filter((m) => m.emergency_contact_number && m.emergency_contact_number.trim() !== "").length;
    return Math.round((count / totalMembers) * 100);
  }, [filteredData, totalMembers]);

  const employmentData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((m) => {
      const status = m.employment_status || "Unspecified";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const eduData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((m) => {
      const edu = m.highest_educational_attainment || "Unspecified";
      counts[edu] = (counts[edu] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [filteredData]);

  const occupationData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((m) => {
      if (m.occupation && m.occupation.trim() !== "") {
        const occ = m.occupation.trim();
        counts[occ] = (counts[occ] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [filteredData]);

  const ministryStats = useMemo(() => {
    const filteredMinistryData = ministryParticipation.filter((mp) => filteredData.some((m) => m.id === mp.member_id));
    const ministryCounts: Record<string, number> = {};
    filteredMinistryData.forEach((mp) => {
      const name = mp.ministry_name || "Unknown Ministry";
      ministryCounts[name] = (ministryCounts[name] || 0) + 1;
    });
    return Object.entries(ministryCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filteredData, ministryParticipation]);

  const faithPromiseStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentYearPromises = faithPromises.filter((fp) => fp.year === currentYear);
    const filteredPromises = currentYearPromises.filter((fp) => filteredData.some((m) => m.id === fp.member_id));
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
      categories: Object.entries(categoryCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8),
    };
  }, [filteredData, faithPromises]);

  const attendanceStats = useMemo(() => {
    if (attendanceData.length === 0) {
      return {
        totalSessions: 0,
        avgTurnoutRate: 0,
        totalPresent: 0,
        totalEnrolled: 0,
        topMinistry: "None",
        trend: [],
        ministryComparison: [],
        sessionsList: [],
      };
    }

    const totalPresent = attendanceData.reduce((acc, s) => acc + (s.present_count || 0), 0);
    const totalEnrolled = attendanceData.reduce((acc, s) => acc + (s.total_enrolled || 0), 0);
    const avgTurnoutRate = totalEnrolled > 0 ? Math.min(100, Math.round((totalPresent / totalEnrolled) * 100)) : 0;

    // Ministry comparison
    const ministryMap: Record<string, { present: number; enrolled: number; count: number }> = {};
    attendanceData.forEach((s) => {
      const name = s.ministry_name || "General Ministry";
      if (!ministryMap[name]) ministryMap[name] = { present: 0, enrolled: 0, count: 0 };
      ministryMap[name].present += s.present_count || 0;
      ministryMap[name].enrolled += s.total_enrolled || 0;
      ministryMap[name].count += 1;
    });

    const ministryComparison = Object.entries(ministryMap).map(([name, d]) => {
      const rate = d.enrolled > 0 ? Math.min(100, Math.round((d.present / d.enrolled) * 100)) : 0;
      return {
        name,
        avgPresent: Math.round(d.present / d.count),
        rate,
        sessionsCount: d.count,
      };
    }).sort((a, b) => b.rate - a.rate);

    const topMinistry = ministryComparison.length > 0 ? ministryComparison[0].name : "None";

    // Weekly trend (by date ascending)
    const dateMap: Record<string, { present: number; enrolled: number }> = {};
    attendanceData.forEach((s) => {
      if (!dateMap[s.date]) dateMap[s.date] = { present: 0, enrolled: 0 };
      dateMap[s.date].present += s.present_count || 0;
      dateMap[s.date].enrolled += s.total_enrolled || 0;
    });

    const trend = Object.entries(dateMap)
      .map(([date, d]) => ({
        date,
        present: d.present,
        enrolled: d.enrolled,
        rate: d.enrolled > 0 ? Math.min(100, Math.round((d.present / d.enrolled) * 100)) : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-16);

    return {
      totalSessions: attendanceData.length,
      avgTurnoutRate,
      totalPresent,
      totalEnrolled,
      topMinistry,
      trend,
      ministryComparison,
      sessionsList: attendanceData,
    };
  }, [attendanceData]);

  const exportAttendanceCSV = () => {
    if (attendanceData.length === 0) return;
    const headers = ["Date", "Schedule", "Ministry", "Present Count", "Total Enrolled", "Turnout Rate (%)", "Submitted By", "Notes"];
    const rows = attendanceData.map((s) => {
      const scheduleLabel = formatServiceSlotBadge(s.date, s.service_time).label;
      return [
        s.date,
        `"${scheduleLabel}"`,
        `"${(s.ministry_name || "").replace(/"/g, '""')}"`,
        s.present_count,
        s.total_enrolled,
        s.total_enrolled > 0 ? Math.round((s.present_count / s.total_enrolled) * 100) : 0,
        `"${(s.submitted_by_name || "").replace(/"/g, '""')}"`,
        `"${(s.notes || "").replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `church-attendance-report-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const axisStyle = { fontSize: 11, fill: tickColor };
  const animProps = { animationBegin: 0, animationDuration: 700, animationEasing: "ease-out" as const };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Explore church demographics, attendance turnout, health preparedness, labor, and generate custom exports.
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

      <Tabs defaultValue="demographics" className="w-full space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="demographics" className="gap-2"><Users className="h-4 w-4" /> Demographics & Locations</TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2"><CalendarCheck className="h-4 w-4" /> Attendance Analytics</TabsTrigger>
          <TabsTrigger value="health" className="gap-2"><HeartPulse className="h-4 w-4" /> Health & Emergency</TabsTrigger>
          <TabsTrigger value="labor" className="gap-2"><Briefcase className="h-4 w-4" /> Career & Education</TabsTrigger>
          <TabsTrigger value="ministry" className="gap-2"><Target className="h-4 w-4" /> Ministry & Pledges</TabsTrigger>
          <TabsTrigger value="raw" className="gap-2"><FileSpreadsheet className="h-4 w-4" /> Raw Export Table</TabsTrigger>
        </TabsList>

        {/* TAB 1: Demographics & Locations */}
        <TabsContent value="demographics" className="space-y-6">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            <Link href="/members" className="block group">
              <Card className="border-t-4 border-t-blue-500 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium group-hover:text-blue-600 transition-colors">Total Members</CardTitle>
                  <div className="h-8 w-8 bg-blue-500/10 rounded-full flex items-center justify-center"><Users className="h-4 w-4 text-blue-500" /></div>
                </CardHeader>
                <CardContent><div className="text-3xl font-bold">{totalMembers}</div></CardContent>
              </Card>
            </Link>

            <Link href="/members?baptized=true" className="block group">
              <Card className="border-t-4 border-t-green-500 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium group-hover:text-green-600 transition-colors">Baptized Ratio</CardTitle>
                  <div className="h-8 w-8 bg-green-500/10 rounded-full flex items-center justify-center"><Droplets className="h-4 w-4 text-green-500" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalMembers ? Math.round((baptizedMembers / totalMembers) * 100) : 0}%</div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">{baptizedMembers} baptized members →</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/members?gender=Female" className="block group">
              <Card className="border-t-4 border-t-pink-500 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium group-hover:text-pink-600 transition-colors">Gender Split</CardTitle>
                  <div className="h-8 w-8 bg-pink-500/10 rounded-full flex items-center justify-center"><Activity className="h-4 w-4 text-pink-500" /></div>
                </CardHeader>
                <CardContent><div className="text-3xl font-bold">{maleCount}M / {femaleCount}F</div></CardContent>
              </Card>
            </Link>

            <Link href="/missions" className="block group">
              <Card className="border-t-4 border-t-amber-500 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium group-hover:text-amber-600 transition-colors">Mission Outreaches</CardTitle>
                  <div className="h-8 w-8 bg-amber-500/10 rounded-full flex items-center justify-center"><Church className="h-4 w-4 text-amber-500" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{activeMissionBranches}</div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Active mission branches →</p>
                </CardContent>
              </Card>
            </Link>

            <Card className="border-t-4 border-t-orange-500 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Residence Cities</CardTitle>
                <div className="h-8 w-8 bg-orange-500/10 rounded-full flex items-center justify-center"><MapPin className="h-4 w-4 text-orange-500" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{uniqueResidenceCities}</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Member home cities</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {/* Gender Distribution Donut */}
            <Card className="col-span-1 min-w-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Gender Distribution</CardTitle>
                <CardDescription className="text-xs">Click slice to view members →</CardDescription>
              </CardHeader>
              <CardContent className="h-[260px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      className="cursor-pointer"
                      onClick={handleGenderClick}
                      strokeWidth={0}
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} className="cursor-pointer hover:opacity-80 transition-opacity" />
                      ))}
                      <Label
                        content={(props: any) => (
                          <DonutCenterLabel viewBox={props.viewBox} value={totalMembers} label="Members" />
                        )}
                        position="center"
                      />
                    </Pie>
                    <Tooltip content={<PieTooltip total={totalMembers} />} />
                  </PieChart>
                </ResponsiveContainer>
                <PillLegend items={genderData.map((d, i) => ({ name: d.name, color: GENDER_COLORS[i % GENDER_COLORS.length], value: d.value, total: totalMembers }))} />
              </CardContent>
            </Card>

            {/* Marital Status */}
            <Card className="col-span-1 md:col-span-1 xl:col-span-2 min-w-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Marital Status</CardTitle>
                <CardDescription className="text-xs">Click bar to view members →</CardDescription>
              </CardHeader>
              <CardContent className="h-[260px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={maritalData} margin={{ top: 16, right: 16, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gradViolet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.75} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip total={totalMembers} />} cursor={{ fill: cursorFill }} />
                    <Bar dataKey="value" fill="url(#gradViolet)" radius={[6, 6, 0, 0]} name="Members" className="cursor-pointer" onClick={handleMaritalClick} {...animProps} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Age Demographics */}
            <Card className="col-span-1 md:col-span-2 min-w-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Age Demographics</CardTitle>
                <CardDescription className="text-xs">Click bar to view members →</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageData} margin={{ top: 16, right: 16, left: 0, bottom: 30 }}>
                    <defs>
                      <linearGradient id="gradEmerald" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.75} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} angle={-35} textAnchor="end" height={55} />
                    <YAxis allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip total={totalMembers} />} cursor={{ fill: cursorFill }} />
                    <Bar dataKey="count" fill="url(#gradEmerald)" radius={[6, 6, 0, 0]} name="Members" className="cursor-pointer" onClick={handleAgeClick} {...animProps} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Mission Church Branches */}
            <Card className="col-span-1 md:col-span-2 min-w-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Mission Church Branches & Outreaches</CardTitle>
                <CardDescription className="text-xs">Member count by assigned church mission branch / outreach →</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={missionBranchData} margin={{ top: 16, right: 16, left: 0, bottom: 35 }}>
                    <defs>
                      <linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#d97706" stopOpacity={0.75} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={50} />
                    <YAxis allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip total={totalMembers} />} cursor={{ fill: cursorFill }} />
                    <Bar dataKey="count" fill="url(#gradAmber)" radius={[6, 6, 0, 0]} name="Members" className="cursor-pointer" onClick={handleMissionBranchClick} {...animProps} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Member Residence Horizontal Bar */}
            <Card className="col-span-1 md:col-span-2 min-w-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Member Residence (City/Municipality)</CardTitle>
                <CardDescription className="text-xs">Click bar to view members in city →</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={residenceCityData} layout="vertical" margin={{ top: 5, right: 24, left: 40, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gradCyan" x1="1" y1="0" x2="0" y2="0">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#0891b2" stopOpacity={0.75} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={gridColor} strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={axisStyle} width={95} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip total={totalMembers} />} cursor={{ fill: cursorFill }} />
                    <Bar dataKey="count" fill="url(#gradCyan)" radius={[0, 6, 6, 0]} name="Members" className="cursor-pointer" onClick={handleResidenceCityClick} {...animProps} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: Attendance Analytics & Reports */}
        <TabsContent value="attendance" className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="border-t-4 border-t-emerald-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Turnout Rate</CardTitle>
                <div className="h-8 w-8 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{attendanceStats.avgTurnoutRate}%</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  {attendanceStats.totalPresent} of {attendanceStats.totalEnrolled} total attendances
                </p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-blue-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sessions Recorded</CardTitle>
                <div className="h-8 w-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <CalendarCheck className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{attendanceStats.totalSessions}</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Recorded ministry sessions</p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-purple-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Turnout Ministry</CardTitle>
                <div className="h-8 w-8 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <Church className="h-4 w-4 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate">{attendanceStats.topMinistry}</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Highest average turnout rate</p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-amber-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Export Attendance Report</CardTitle>
                <div className="h-8 w-8 bg-amber-500/10 rounded-full flex items-center justify-center">
                  <Download className="h-4 w-4 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={exportAttendanceCSV}
                  disabled={attendanceStats.totalSessions === 0}
                  className="w-full h-9 text-xs font-semibold gap-1.5 shadow-xs"
                >
                  <Download className="h-3.5 w-3.5" /> Export Attendance CSV
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid min-w-0 gap-6 md:grid-cols-2">
            {/* Area Chart: Turnout Trend */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Attendance Rate Trend (%)
                </CardTitle>
                <CardDescription>Turnout percentage over recent attendance dates</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                {attendanceStats.trend.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    No attendance records available for trend analysis.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={attendanceStats.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAttTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={axisStyle} axisLine={false} tickLine={false} unit="%" />
                      <Tooltip />
                      <Area type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAttTrend)" name="Turnout %" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Bar Chart: Turnout by Ministry */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Turnout Rate by Ministry
                </CardTitle>
                <CardDescription>Average turnout percentage comparison across ministries</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                {attendanceStats.ministryComparison.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    No ministry comparison data available.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceStats.ministryComparison} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <defs>
                        <linearGradient id="gradIndigoAtt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#4338ca" stopOpacity={0.75} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} angle={-15} textAnchor="end" />
                      <YAxis domain={[0, 100]} tick={axisStyle} axisLine={false} tickLine={false} unit="%" />
                      <Tooltip />
                      <Bar dataKey="rate" fill="url(#gradIndigoAtt)" radius={[6, 6, 0, 0]} name="Avg Turnout %" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Attendance Sessions Log Table */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Ministry Attendance Sessions Log</CardTitle>
                <CardDescription className="text-xs">Historical log of all recorded ministry sessions</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={exportAttendanceCSV}
                disabled={attendanceStats.totalSessions === 0}
                className="text-xs gap-1.5 h-8"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
            </CardHeader>
            <CardContent>
              {attendanceStats.sessionsList.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No attendance sessions recorded in the database yet.
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 border-b font-semibold text-muted-foreground">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Ministry</th>
                        <th className="p-3">Present / Total</th>
                        <th className="p-3">Turnout Rate</th>
                        <th className="p-3">Submitted By</th>
                        <th className="p-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {attendanceStats.sessionsList.map((s) => {
                        const rate = s.total_enrolled > 0 ? Math.round((s.present_count / s.total_enrolled) * 100) : 0;
                        return (
                          <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-semibold text-foreground whitespace-nowrap">{s.date}</td>
                            <td className="p-3 font-medium text-foreground">{s.ministry_name || "—"}</td>
                            <td className="p-3 whitespace-nowrap">
                              {s.present_count} / {s.total_enrolled}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  rate >= 80
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                }`}
                              >
                                {rate}%
                              </span>
                            </td>
                            <td className="p-3 text-muted-foreground whitespace-nowrap">{s.submitted_by_name || "—"}</td>
                            <td className="p-3 text-muted-foreground max-w-[200px] truncate">{s.notes || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Health & Emergency Preparedness */}
        <TabsContent value="health" className="space-y-6">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/members" className="block group">
              <Card className="border-t-4 border-t-red-500 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium group-hover:text-red-600 transition-colors">Emergency Readiness</CardTitle>
                  <div className="h-8 w-8 bg-red-500/10 rounded-full flex items-center justify-center"><ShieldAlert className="h-4 w-4 text-red-500" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{emergencyReadinessPercent}%</div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Members with emergency contact on file →</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/members?blood_type=A" className="block group">
              <Card className="border-t-4 border-t-rose-500 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium group-hover:text-rose-600 transition-colors">Blood Donor Pool</CardTitle>
                  <div className="h-8 w-8 bg-rose-500/10 rounded-full flex items-center justify-center"><HeartPulse className="h-4 w-4 text-rose-500" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{filteredData.filter((m) => m.blood_type && m.blood_type.trim() !== "").length}</div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Members with blood type specified →</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/members?has_allergies=true" className="block group">
              <Card className="border-t-4 border-t-amber-500 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium group-hover:text-amber-600 transition-colors">Dietary & Allergy Alerts</CardTitle>
                  <div className="h-8 w-8 bg-amber-500/10 rounded-full flex items-center justify-center"><Activity className="h-4 w-4 text-amber-500" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{allergyData.find((d) => d.name === "Known Allergies")?.value || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Members requiring allergy accommodations →</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            {/* Blood Type Bar — Interactive */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Blood Type Distribution</CardTitle>
                <CardDescription className="text-xs">Click bar to view matching members →</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bloodTypeData} margin={{ top: 16, right: 16, left: 0, bottom: 25 }}>
                    <defs>
                      <linearGradient id="gradRose" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fb7185" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#e11d48" stopOpacity={0.75} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip total={totalMembers} />} cursor={{ fill: cursorFill }} />
                    <Bar dataKey="count" fill="url(#gradRose)" radius={[6, 6, 0, 0]} name="Members" className="cursor-pointer" onClick={handleBloodTypeClick} {...animProps} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Allergy Donut — Interactive */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Allergy & Health Safety Overview</CardTitle>
                <CardDescription className="text-xs">Click slice to view members →</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="75%">
                  <PieChart>
                    <Pie data={allergyData} cx="50%" cy="50%" innerRadius={58} outerRadius={82} paddingAngle={5} dataKey="value" strokeWidth={0} className="cursor-pointer" onClick={handleAllergyClick}>
                      {allergyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={ALLERGY_COLORS[index % ALLERGY_COLORS.length]} className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleAllergyClick(entry)} />
                      ))}
                      <Label
                        content={(props: any) => (
                          <DonutCenterLabel viewBox={props.viewBox} value={allergyData.find((d) => d.name === "Known Allergies")?.value || 0} label="Alerts" />
                        )}
                        position="center"
                      />
                    </Pie>
                    <Tooltip content={<PieTooltip total={totalMembers} />} />
                  </PieChart>
                </ResponsiveContainer>
                <PillLegend items={allergyData.map((d, i) => ({ name: d.name, color: ALLERGY_COLORS[i % ALLERGY_COLORS.length], value: d.value, total: totalMembers }))} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: Career & Education */}
        <TabsContent value="labor" className="space-y-6">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/members?employment=Employed" className="block group">
              <Card className="border-t-4 border-t-purple-500 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium group-hover:text-purple-600 transition-colors">Workforce Employed</CardTitle>
                  <div className="h-8 w-8 bg-purple-500/10 rounded-full flex items-center justify-center"><Briefcase className="h-4 w-4 text-purple-500" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{filteredData.filter((m) => (m.employment_status || "").toLowerCase().includes("employ")).length}</div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Employed or self-employed members →</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/members?employment=Student" className="block group">
              <Card className="border-t-4 border-t-cyan-500 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium group-hover:text-cyan-600 transition-colors">Student Community</CardTitle>
                  <div className="h-8 w-8 bg-cyan-500/10 rounded-full flex items-center justify-center"><GraduationCap className="h-4 w-4 text-cyan-500" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{filteredData.filter((m) => (m.employment_status || "").toLowerCase() === "student").length}</div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Students pursuing education →</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/members?education=College" className="block group">
              <Card className="border-t-4 border-t-indigo-500 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium group-hover:text-indigo-600 transition-colors">Higher Education Ratio</CardTitle>
                  <div className="h-8 w-8 bg-indigo-500/10 rounded-full flex items-center justify-center"><GraduationCap className="h-4 w-4 text-indigo-500" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {totalMembers ? Math.round((filteredData.filter((m) => ["College", "Postgraduate"].includes(m.highest_educational_attainment || "")).length / totalMembers) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">College degree or higher →</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {/* Employment Status Bar — Interactive */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Employment Status</CardTitle>
                <CardDescription className="text-xs">Click bar to view matching members →</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={employmentData} margin={{ top: 16, right: 16, left: 0, bottom: 25 }}>
                    <defs>
                      <linearGradient id="gradViolet2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.75} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={50} />
                    <YAxis allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip total={totalMembers} />} cursor={{ fill: cursorFill }} />
                    <Bar dataKey="count" fill="url(#gradViolet2)" radius={[6, 6, 0, 0]} name="Members" className="cursor-pointer" onClick={handleEmploymentClick} {...animProps} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Educational Attainment Bar — Interactive */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Educational Attainment</CardTitle>
                <CardDescription className="text-xs">Click bar to view matching members →</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eduData} margin={{ top: 16, right: 16, left: 0, bottom: 25 }}>
                    <defs>
                      <linearGradient id="gradCyan2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#0891b2" stopOpacity={0.75} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={50} />
                    <YAxis allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip total={totalMembers} />} cursor={{ fill: cursorFill }} />
                    <Bar dataKey="count" fill="url(#gradCyan2)" radius={[6, 6, 0, 0]} name="Members" className="cursor-pointer" onClick={handleEducationClick} {...animProps} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Professional Fields Horizontal Bar — Interactive */}
            <Card className="shadow-sm md:col-span-2 xl:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Top Professional Fields</CardTitle>
                <CardDescription className="text-xs">Click bar to view matching members →</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupationData} layout="vertical" margin={{ top: 5, right: 24, left: 40, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gradEmerald2" x1="1" y1="0" x2="0" y2="0">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.75} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={gridColor} strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={axisStyle} width={95} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip total={totalMembers} />} cursor={{ fill: cursorFill }} />
                    <Bar dataKey="count" fill="url(#gradEmerald2)" radius={[0, 6, 6, 0]} name="Members" className="cursor-pointer" onClick={handleOccupationClick} {...animProps} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 4: Ministry & Faith Promises */}
        <TabsContent value="ministry" className="space-y-6">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            {/* Ministry Participation Bar */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Ministry Participation</CardTitle>
                <CardDescription className="text-xs">Click bar to view matching members →</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ministryStats} margin={{ top: 16, right: 16, left: 0, bottom: 35 }}>
                    <defs>
                      <linearGradient id="gradTeal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#0d9488" stopOpacity={0.75} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={50} />
                    <YAxis allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip total={totalMembers} />} cursor={{ fill: cursorFill }} />
                    <Bar dataKey="count" fill="url(#gradTeal)" radius={[6, 6, 0, 0]} name="Members" className="cursor-pointer" onClick={handleMinistryClick} {...animProps} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Faith Promise Categories Bar — Interactive */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Faith Promise Categories</CardTitle>
                <CardDescription className="text-xs">Click bar to view faith promise pledges →</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={faithPromiseStats.categories} margin={{ top: 16, right: 16, left: 0, bottom: 35 }}>
                    <defs>
                      <linearGradient id="gradRose2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fb7185" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#e11d48" stopOpacity={0.75} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={50} />
                    <YAxis allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip total={faithPromiseStats.totalCommitments} />} cursor={{ fill: cursorFill }} />
                    <Bar dataKey="count" fill="url(#gradRose2)" radius={[6, 6, 0, 0]} name="Commitments" className="cursor-pointer" onClick={handleFaithPromiseClick} {...animProps} />
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
