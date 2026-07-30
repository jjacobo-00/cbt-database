"use client"

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

interface DashboardChartsProps {
  monthlyData: { month: string; currentYear: number; previousYear: number; monthNum: number }[]
  churchRoleData: { name: string; value: number }[]
  ageData: { name: string; value: number }[]
}

export function DashboardCharts({ monthlyData, churchRoleData, ageData }: DashboardChartsProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const gridColor = isDark ? "#333" : "#e5e7eb"
  const textColor = isDark ? "#888" : "#6b7280"
  
  // Custom colors for different charts
  const ROLE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16']
  const AGE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6']

  const tooltipStyle = { 
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    borderColor: isDark ? '#374151' : '#e5e7eb',
    borderRadius: '8px',
    color: isDark ? '#f3f4f6' : '#111827'
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
      {/* Member Growth Line Chart with Year-over-Year Comparison */}
      <Card className="lg:col-span-3 xl:col-span-2 transition-all duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle>Member Growth</CardTitle>
          <CardDescription>New members joined this year vs previous year (last 6 months).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
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
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="previousYear" 
                  stroke="#9ca3af" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Previous Year"
                  dot={{ fill: "#9ca3af", strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Church Role Distribution Pie Chart */}
      <Card className="lg:col-span-1 xl:col-span-1 transition-all duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle>Church Roles</CardTitle>
          <CardDescription>Distribution of church roles among members.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={churchRoleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {churchRoleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
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
          <CardTitle>Age Demographics</CardTitle>
          <CardDescription>Breakdown of our congregation by age groups.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
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
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {ageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={AGE_COLORS[index % AGE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
