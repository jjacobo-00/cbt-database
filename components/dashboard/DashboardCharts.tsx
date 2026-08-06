"use client"

import React from "react"
import {
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
  AreaChart,
  Area,
  Label,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { Users } from "lucide-react"

interface DashboardChartsProps {
  monthlyData: { month: string; currentYear: number; previousYear: number; monthNum: number }[]
  membershipStatusData: { name: string; value: number }[]
  ageData: { name: string; value: number }[]
}

// Vivid palette colors for donut and bars
const COMMITMENT_COLORS = ["#8b5cf6", "#64748b"] // Serving (Purple), Not Serving (Slate)
const AGE_BAR_GRADIENTS = [
  { id: "gradAge0", start: "#60a5fa", end: "#2563eb" }, // Blue
  { id: "gradAge1", start: "#a78bfa", end: "#7c3aed" }, // Violet
  { id: "gradAge2", start: "#f472b6", end: "#db2777" }, // Pink
  { id: "gradAge3", start: "#fbbf24", end: "#d97706" }, // Amber
  { id: "gradAge4", start: "#2dd4bf", end: "#0d9488" }, // Teal
]

// Glassmorphic Custom Tooltip for Growth & Age
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: any[]
  label?: string
}) => {
  if (!active || !payload?.length) return null

  return (
    <div className="px-3.5 py-2.5 rounded-xl border border-border/60 bg-popover/95 backdrop-blur-md shadow-2xl min-w-[130px]">
      <p className="text-xs font-semibold text-foreground mb-1.5">{label}</p>
      <div className="space-y-1">
        {payload.map((item: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ background: item.color || item.fill }}
              />
              <span className="text-muted-foreground">{item.name}:</span>
            </div>
            <span className="font-bold text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Glassmorphic Pie Tooltip
const PieTooltip = ({
  active,
  payload,
  total,
}: {
  active?: boolean
  payload?: any[]
  total: number
}) => {
  if (!active || !payload?.length) return null
  const { name, value, fill } = payload[0]
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0"

  return (
    <div className="px-3.5 py-2.5 rounded-xl border border-border/60 bg-popover/95 backdrop-blur-md shadow-2xl min-w-[130px]">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: fill }} />
        <p className="text-xs font-semibold text-foreground">{name}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-foreground">{value}</span>
        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
          {pct}%
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-0.5">members</p>
    </div>
  )
}

// Pill Legend for Donut
const PillLegend = ({
  items,
}: {
  items: { name: string; color: string; value: number; total: number }[]
}) => (
  <div className="flex flex-wrap justify-center gap-2 mt-3">
    {items.map((item) => {
      const pct = item.total > 0 ? ((item.value / item.total) * 100).toFixed(1) : "0"
      return (
        <div
          key={item.name}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 text-xs font-medium"
        >
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: item.color }} />
          <span className="text-foreground">{item.name}</span>
          <span className="text-muted-foreground">{pct}%</span>
        </div>
      )
    })}
  </div>
)

// Donut Center Label (SVG)
const DonutCenterLabel = ({
  viewBox,
  value,
  label,
}: {
  viewBox?: { cx: number; cy: number }
  value: number
  label: string
}) => {
  const cx = viewBox?.cx ?? 0
  const cy = viewBox?.cy ?? 0
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan
        x={cx}
        dy="-0.4em"
        style={{ fontSize: "22px", fontWeight: 700, fill: "currentColor" }}
        className="fill-foreground"
      >
        {value}
      </tspan>
      <tspan
        x={cx}
        dy="1.5em"
        style={{ fontSize: "11px", fill: "currentColor" }}
        className="fill-muted-foreground"
      >
        {label}
      </tspan>
    </text>
  )
}

export function DashboardCharts({ monthlyData, membershipStatusData, ageData }: DashboardChartsProps) {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const tickColor = isDark ? "hsl(0 0% 65%)" : "hsl(0 0% 38%)"
  const gridColor = isDark ? "hsl(0 0% 22%)" : "hsl(0 0% 88%)"
  const cursorFill = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"

  const totalStatusMembers = membershipStatusData.reduce((acc, curr) => acc + curr.value, 0)
  const servingCount = membershipStatusData.find((d) => d.name.includes("Serving"))?.value || 0

  // Direct Navigation Handlers
  const handleGrowthClick = (entry?: any) => {
    if (entry && entry.activePayload && entry.activePayload[0]) {
      const payload = entry.activePayload[0].payload
      if (payload && payload.month) {
        router.push(`/members?joined=month_${encodeURIComponent(payload.month)}`)
        return
      }
    }
    router.push("/members?joined=this_year")
  }

  const handleMinistryClick = (entry: any) => {
    if (!entry) return
    const name = (entry.name || entry.payload?.name || "").toLowerCase()
    if (name.includes("not")) {
      router.push("/members?ministry=not_serving")
    } else {
      router.push("/members?ministry=serving")
    }
  }

  const handleAgeClick = (entry: any) => {
    if (!entry) return
    const name = (entry.name || entry.payload?.name || "").toLowerCase()
    if (name.includes("kids")) router.push("/members?age_group=kids")
    else if (name.includes("youth") || name.includes("teens")) router.push("/members?age_group=teens")
    else if (name.includes("young")) router.push("/members?age_group=young_adults")
    else if (name.includes("adults")) router.push("/members?age_group=adults")
    else if (name.includes("seniors")) router.push("/members?age_group=seniors")
    else router.push("/members")
  }

  const axisStyle = { fontSize: 11, fill: tickColor }
  const animProps = {
    animationBegin: 0,
    animationDuration: 700,
    animationEasing: "ease-out" as const,
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
      {/* Member Growth Glowing Area Chart */}
      <Card
        className="lg:col-span-3 xl:col-span-2 transition-all duration-300 hover:shadow-md cursor-pointer"
        onClick={handleGrowthClick}
      >
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Member Growth</span>
            <span className="text-xs text-primary font-normal flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> Click to view directory →
            </span>
          </CardTitle>
          <CardDescription>New members joined this year vs previous year (last 6 months).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full touch-contain">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyData}
                margin={{ top: 16, right: 24, left: 0, bottom: 0 }}
                onClick={handleGrowthClick}
              >
                <defs>
                  <linearGradient id="colorCurrentYearGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorPreviousYearGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9ca3af" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#9ca3af" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={axisStyle}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={axisStyle}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: tickColor, strokeDasharray: "3 3" }} />
                <Area
                  type="monotone"
                  dataKey="currentYear"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#colorCurrentYearGrad)"
                  name="This Year"
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 5, className: "cursor-pointer" }}
                  activeDot={{ r: 7, strokeWidth: 2 }}
                  {...animProps}
                />
                <Area
                  type="monotone"
                  dataKey="previousYear"
                  stroke="#9ca3af"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="url(#colorPreviousYearGrad)"
                  name="Previous Year"
                  dot={{ fill: "#9ca3af", strokeWidth: 2, r: 4, className: "cursor-pointer" }}
                  {...animProps}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Ministry Volunteer Engagement Status Donut Chart */}
      <Card className="lg:col-span-1 xl:col-span-1 transition-all duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ministry Engagement</span>
            <span className="text-xs text-primary font-normal">Click slice →</span>
          </CardTitle>
          <CardDescription>Members serving in active ministries vs not yet serving.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="75%">
              <PieChart>
                <Pie
                  data={membershipStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={5}
                  dataKey="value"
                  strokeWidth={0}
                  className="cursor-pointer"
                  onClick={handleMinistryClick}
                >
                  {membershipStatusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COMMITMENT_COLORS[index % COMMITMENT_COLORS.length]}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleMinistryClick(entry)}
                    />
                  ))}
                  <Label
                    content={(props: any) => (
                      <DonutCenterLabel
                        viewBox={props.viewBox}
                        value={servingCount}
                        label="Serving"
                      />
                    )}
                    position="center"
                  />
                </Pie>
                <Tooltip content={<PieTooltip total={totalStatusMembers} />} />
              </PieChart>
            </ResponsiveContainer>
            <PillLegend
              items={membershipStatusData.map((d, i) => ({
                name: d.name,
                color: COMMITMENT_COLORS[i % COMMITMENT_COLORS.length],
                value: d.value,
                total: totalStatusMembers,
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Age Demographics Dual-Tone Gradient Bar Chart */}
      <Card className="lg:col-span-3 transition-all duration-300 hover:shadow-md mt-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Age Demographics</span>
            <span className="text-xs text-primary font-normal">Click any bar to view matching members →</span>
          </CardTitle>
          <CardDescription>Breakdown of congregation by age groups.</CardDescription>
        </CardHeader>
        <CardContent>
          {ageData.length > 0 ? (
            <div className="h-[300px] w-full touch-contain">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ageData}
                  margin={{ top: 16, right: 24, left: 0, bottom: 0 }}
                  onClick={(state: any) => {
                    if (state && state.activePayload && state.activePayload[0]) {
                      handleAgeClick(state.activePayload[0].payload)
                    }
                  }}
                >
                  <defs>
                    {AGE_BAR_GRADIENTS.map((g) => (
                      <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={g.start} stopOpacity={0.95} />
                        <stop offset="100%" stopColor={g.end} stopOpacity={0.75} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={axisStyle}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    tick={axisStyle}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: cursorFill }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[6, 6, 0, 0]}
                    className="cursor-pointer"
                    {...animProps}
                  >
                    {ageData.map((entry, index) => {
                      const grad = AGE_BAR_GRADIENTS[index % AGE_BAR_GRADIENTS.length]
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={`url(#${grad.id})`}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleAgeClick(entry)}
                        />
                      )
                    })}
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
    </div>
  )
}
