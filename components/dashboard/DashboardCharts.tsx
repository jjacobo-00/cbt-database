"use client"

import React, { useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
  Line,
  LineChart
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Users, Info, ArrowRight } from "lucide-react"
import Link from "next/link"

interface DashboardChartsProps {
  monthlyData: { month: string; currentYear: number; previousYear: number; monthNum: number }[]
  membershipStatusData: { name: string; value: number }[]
  ageData: { name: string; value: number }[]
}

export function DashboardCharts({ monthlyData, membershipStatusData, ageData }: DashboardChartsProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const gridColor = isDark ? "#333" : "#e5e7eb"
  const textColor = isDark ? "#888" : "#6b7280"
  
  // Custom colors for different charts
  const COMMITMENT_COLORS = ['#8b5cf6', '#9ca3af'] // Purple (Committed), Gray (Not Committed)
  const AGE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6']

  const tooltipStyle = { 
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    borderColor: isDark ? '#374151' : '#e5e7eb',
    borderRadius: '8px',
    color: isDark ? '#f3f4f6' : '#111827'
  }

  // Interactive drilldown modal state
  const [selectedSegment, setSelectedSegment] = useState<{ title: string; count: number; category: string } | null>(null)

  const handleBarClick = (entry: any, categoryName: string) => {
    if (!entry) return
    const title = entry.name || entry.month || "Segment"
    const count = entry.value ?? entry.currentYear ?? 0
    setSelectedSegment({ title, count, category: categoryName })
  }

  const getFilteredMembersLink = () => {
    if (!selectedSegment) return "/members"
    const { category, title } = selectedSegment
    if (category === "Age Demographics") {
      if (title.includes("Kids")) return "/members?age_group=kids"
      if (title.includes("Teens")) return "/members?age_group=teens"
      if (title.includes("Young Adults")) return "/members?age_group=young_adults"
      if (title.includes("Adults")) return "/members?age_group=adults"
      if (title.includes("Seniors")) return "/members?age_group=seniors"
    }
    if (category === "Ministry Engagement") {
      if (title.includes("Not")) return "/members?ministry=not_serving"
      if (title.includes("Serving")) return "/members?ministry=serving"
    }
    return "/members"
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
      {/* Member Growth Line Chart with Year-over-Year Comparison */}
      <Card className="lg:col-span-3 xl:col-span-2 transition-all duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Member Growth</span>
            <span className="text-xs text-muted-foreground font-normal flex items-center gap-1">
              <Info className="h-3.5 w-3.5" /> Click points for details
            </span>
          </CardTitle>
          <CardDescription>New members joined this year vs previous year (last 6 months).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full touch-contain">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCurrentYear" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPreviousYear" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#9ca3af" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis 
                  dataKey="month" 
                  stroke={textColor} 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke={textColor} 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="currentYear" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="This Year"
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 5, className: "cursor-pointer" }}
                  onClick={(e: any) => handleBarClick(e?.payload, "Monthly Growth")}
                />
                <Line 
                  type="monotone" 
                  dataKey="previousYear" 
                  stroke="#9ca3af" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Previous Year"
                  dot={{ fill: "#9ca3af", strokeWidth: 2, r: 4, className: "cursor-pointer" }}
                  onClick={(e: any) => handleBarClick(e?.payload, "Previous Year Growth")}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Ministry Volunteer Engagement Status Pie Chart */}
      <Card className="lg:col-span-1 xl:col-span-1 transition-all duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ministry Volunteer Engagement</span>
            <span className="text-xs text-muted-foreground font-normal">Click slice</span>
          </CardTitle>
          <CardDescription>Members serving in active ministries vs not yet serving.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={membershipStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  className="cursor-pointer"
                  onClick={(e) => handleBarClick(e, "Ministry Engagement")}
                >
                  {membershipStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COMMITMENT_COLORS[index % COMMITMENT_COLORS.length]} className="cursor-pointer hover:opacity-80 transition-opacity" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Age Demographics Bar Chart */}
      <Card className="lg:col-span-3 transition-all duration-300 hover:shadow-md mt-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Age Demographics</span>
            <span className="text-xs text-muted-foreground font-normal">Click bar to inspect</span>
          </CardTitle>
          <CardDescription>Breakdown of our congregation by age groups.</CardDescription>
        </CardHeader>
        <CardContent>
          {ageData.length > 0 ? (
            <div className="h-[300px] w-full touch-contain">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ageData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis 
                    dataKey="name" 
                    stroke={textColor} 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke={textColor} 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? '#333' : '#f3f4f6' }} />
                  <Bar 
                    dataKey="value" 
                    radius={[4, 4, 0, 0]}
                    className="cursor-pointer"
                    onClick={(e) => handleBarClick(e, "Age Demographics")}
                  >
                    {ageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={AGE_COLORS[index % AGE_COLORS.length]} className="cursor-pointer hover:opacity-80 transition-opacity" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] w-full flex items-center justify-center">
              <p className="text-muted-foreground">No age data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactive Segment Detail Dialog */}
      <Dialog open={!!selectedSegment} onOpenChange={(open) => !open && setSelectedSegment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {selectedSegment?.category}: {selectedSegment?.title}
            </DialogTitle>
            <DialogDescription>
              Detailed breakdown for the selected chart segment.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Members in Segment</span>
                <h3 className="text-3xl font-bold text-primary mt-0.5">{selectedSegment?.count}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                {selectedSegment?.count}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              You can filter and view complete member records, contact numbers, and emails in the Members Directory or Reports module.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setSelectedSegment(null)}>
              Close
            </Button>
            <Button asChild className="gap-2">
              <Link href={getFilteredMembersLink()} onClick={() => setSelectedSegment(null)}>
                <span>View Filtered Members Directory</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}