"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Filter,
  Download,
  Eye,
  EyeOff,
} from "lucide-react";

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

interface MinistryCapacityData {
  id: string;
  name: string;
  description: string | null;
  for_everyone: boolean;
  participantCount: number;
  engagementRate: number;
  ageGroups: {
    kids: number;
    youth: number;
    youngAdults: number;
    adults: number;
    seniors: number;
  };
  employmentBreakdown: {
    employed: number;
    unemployed: number;
    student: number;
    retired: number;
    selfEmployed: number;
  };
  geographicReach: number;
  growthTrend: "growing" | "stable";
  capacityStatus: "needs_volunteers" | "adequate" | "growing";
  created_at: Date | null;
}

interface MinistryCapacityClientProps {
  ministryData: MinistryCapacityData[];
}

export function MinistryCapacityClient({
  ministryData,
}: MinistryCapacityClientProps) {
  const [selectedMinistry, setSelectedMinistry] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"overview" | "detailed">("overview");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "needs_volunteers" | "adequate" | "growing"
  >("all");

  const filteredMinistries = useMemo(() => {
    if (filterStatus === "all") return ministryData;
    return ministryData.filter((m) => m.capacityStatus === filterStatus);
  }, [ministryData, filterStatus]);

  const selectedMinistryData = useMemo(() => {
    if (!selectedMinistry) return null;
    return ministryData.find((m) => m.id === selectedMinistry);
  }, [selectedMinistry, ministryData]);

  // Aggregate data for overview charts
  const capacityDistribution = useMemo(() => {
    const distribution = {
      needs_volunteers: ministryData.filter(
        (m) => m.capacityStatus === "needs_volunteers",
      ).length,
      adequate: ministryData.filter((m) => m.capacityStatus === "adequate")
        .length,
      growing: ministryData.filter((m) => m.capacityStatus === "growing")
        .length,
    };
    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
    }));
  }, [ministryData]);

  const topMinistriesByEngagement = useMemo(() => {
    return [...ministryData]
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, 10)
      .map((m) => ({
        name: m.name.length > 20 ? m.name.substring(0, 20) + "..." : m.name,
        engagementRate: m.engagementRate,
        participantCount: m.participantCount,
      }));
  }, [ministryData]);

  const totalAgeDemographics = useMemo(() => {
    const totals = { kids: 0, youth: 0, youngAdults: 0, adults: 0, seniors: 0 };
    ministryData.forEach((m) => {
      totals.kids += m.ageGroups.kids;
      totals.youth += m.ageGroups.youth;
      totals.youngAdults += m.ageGroups.youngAdults;
      totals.adults += m.ageGroups.adults;
      totals.seniors += m.ageGroups.seniors;
    });
    return [
      { name: "Kids (0-12)", value: totals.kids },
      { name: "Youth (13-17)", value: totals.youth },
      { name: "Young Adults (18-35)", value: totals.youngAdults },
      { name: "Adults (36-55)", value: totals.adults },
      { name: "Seniors (60+)", value: totals.seniors },
    ].filter((d) => d.value > 0);
  }, [ministryData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "needs_volunteers":
        return "text-amber-500";
      case "adequate":
        return "text-blue-500";
      case "growing":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "needs_volunteers":
        return <AlertCircle className="h-4 w-4" />;
      case "adequate":
        return <CheckCircle2 className="h-4 w-4" />;
      case "growing":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="h-10 rounded-lg border border-input bg-card text-foreground px-4 shadow-sm"
          >
            <option value="all">All Ministries</option>
            <option value="needs_volunteers">Needs Volunteers</option>
            <option value="adequate">Adequate</option>
            <option value="growing">Growing</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "overview" ? "default" : "outline"}
            onClick={() => setViewMode("overview")}
            size="sm"
          >
            Overview
          </Button>
          <Button
            variant={viewMode === "detailed" ? "default" : "outline"}
            onClick={() => setViewMode("detailed")}
            size="sm"
          >
            Detailed
          </Button>
        </div>
      </div>

      {viewMode === "overview" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Capacity Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Ministry Capacity Status</CardTitle>
              <CardDescription>
                Distribution of ministry health across the church
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={capacityDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {capacityDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Ministries by Engagement */}
          <Card>
            <CardHeader>
              <CardTitle>Top Ministries by Engagement</CardTitle>
              <CardDescription>
                Highest participant engagement rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topMinistriesByEngagement} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={80}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="engagementRate"
                      fill="#3b82f6"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Overall Age Demographics */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Overall Ministry Age Demographics</CardTitle>
              <CardDescription>
                Age distribution across all ministry participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={totalAgeDemographics}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                      {totalAgeDemographics.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Detailed Ministry List */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Ministry Analysis</CardTitle>
              <CardDescription>
                Click on a ministry to see detailed breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMinistries.map((ministry) => (
                  <div
                    key={ministry.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedMinistry(ministry.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${getStatusColor(ministry.capacityStatus)} bg-current/10`}
                        >
                          {getStatusIcon(ministry.capacityStatus)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{ministry.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {ministry.description || "No description"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {ministry.participantCount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          participants
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Engagement:{" "}
                        <span className="font-semibold text-foreground">
                          {ministry.engagementRate}%
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        Geographic Reach:{" "}
                        <span className="font-semibold text-foreground">
                          {ministry.geographicReach} cities
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        Status:{" "}
                        <span
                          className={`font-semibold ${getStatusColor(ministry.capacityStatus)}`}
                        >
                          {ministry.capacityStatus.replace("_", " ")}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected Ministry Details */}
          {selectedMinistryData && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedMinistryData.name} - Detailed Analysis
                </CardTitle>
                <CardDescription>
                  Comprehensive breakdown of ministry composition
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Age Groups */}
                  <div>
                    <h4 className="font-semibold mb-3">Age Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Kids (0-12)</span>
                        <span className="font-semibold">
                          {selectedMinistryData.ageGroups.kids}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Youth (13-17)</span>
                        <span className="font-semibold">
                          {selectedMinistryData.ageGroups.youth}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Young Adults (18-35)</span>
                        <span className="font-semibold">
                          {selectedMinistryData.ageGroups.youngAdults}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Adults (36-55)</span>
                        <span className="font-semibold">
                          {selectedMinistryData.ageGroups.adults}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Seniors (60+)</span>
                        <span className="font-semibold">
                          {selectedMinistryData.ageGroups.seniors}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Employment Status */}
                  <div>
                    <h4 className="font-semibold mb-3">Employment Status</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Employed</span>
                        <span className="font-semibold">
                          {selectedMinistryData.employmentBreakdown.employed}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Self-employed</span>
                        <span className="font-semibold">
                          {
                            selectedMinistryData.employmentBreakdown
                              .selfEmployed
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Student</span>
                        <span className="font-semibold">
                          {selectedMinistryData.employmentBreakdown.student}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Unemployed</span>
                        <span className="font-semibold">
                          {selectedMinistryData.employmentBreakdown.unemployed}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Retired</span>
                        <span className="font-semibold">
                          {selectedMinistryData.employmentBreakdown.retired}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedMinistry(null)}
                    className="w-full"
                  >
                    Close Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
