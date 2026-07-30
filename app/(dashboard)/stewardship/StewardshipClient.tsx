"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts"
import { 
  DollarSign, TrendingUp, Target, Calendar, Users, 
  Filter, Download, Eye, EyeOff 
} from "lucide-react"

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16']

interface CategoryAnalysis {
  id: string
  name: string
  description: string | null
  is_monthly: boolean
  month: number | null
  commitmentCount: number
  isMonthly: boolean
  specificMonth: number | null
}

interface StewardshipClientProps {
  categoryAnalysis: CategoryAnalysis[]
  employmentBreakdown: {
    employed: number
    unemployed: number
    student: number
    retired: number
    selfEmployed: number
  }
  tenureBreakdown: {
    new: number
    established: number
    longTerm: number
  }
  geographicReach: number
  givingMemberCount: number
  currentYearData: Array<{ member_id: string; year: number; commitment_id: string }>
  previousYearData: Array<{ member_id: string; year: number }>
}

export function StewardshipClient({ 
  categoryAnalysis, 
  employmentBreakdown, 
  tenureBreakdown,
  geographicReach,
  givingMemberCount,
  currentYearData,
  previousYearData
}: StewardshipClientProps) {
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview')
  const [timeRange, setTimeRange] = useState<'current' | 'comparison'>('current')

  // Prepare data for charts
  const categoryChartData = useMemo(() => {
    return categoryAnalysis
      .map(cat => ({
        name: cat.name.length > 15 ? cat.name.substring(0, 15) + '...' : cat.name,
        count: cat.commitmentCount,
        isMonthly: cat.isMonthly ? 'Monthly' : 'One-time'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [categoryAnalysis])

  const employmentChartData = useMemo(() => {
    return Object.entries(employmentBreakdown)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
      .filter(d => d.value > 0)
  }, [employmentBreakdown])

  const tenureChartData = useMemo(() => {
    return [
      { name: 'New (≤1 yr)', value: tenureBreakdown.new },
      { name: 'Established (1-5 yrs)', value: tenureBreakdown.established },
      { name: 'Long-term (5+ yrs)', value: tenureBreakdown.longTerm },
    ].filter(d => d.value > 0)
  }, [tenureBreakdown])

  const monthlyVsOneTimeData = useMemo(() => {
    const monthly = categoryAnalysis.filter(c => c.isMonthly).reduce((sum, c) => sum + c.commitmentCount, 0)
    const oneTime = categoryAnalysis.filter(c => !c.isMonthly).reduce((sum, c) => sum + c.commitmentCount, 0)
    return [
      { name: 'Monthly', value: monthly },
      { name: 'One-time', value: oneTime },
    ]
  }, [categoryAnalysis])

  const yearComparisonData = useMemo(() => {
    return [
      { year: previousYearData.length > 0 ? new Date().getFullYear() - 1 : 'Previous', commitments: previousYearData.length },
      { year: new Date().getFullYear(), commitments: currentYearData.length },
    ]
  }, [currentYearData.length, previousYearData.length])

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="h-10 rounded-lg border border-input bg-card text-foreground px-4 shadow-sm"
          >
            <option value="current">Current Year</option>
            <option value="comparison">Year Comparison</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'overview' ? 'default' : 'outline'}
            onClick={() => setViewMode('overview')}
            size="sm"
          >
            Overview
          </Button>
          <Button 
            variant={viewMode === 'detailed' ? 'default' : 'outline'}
            onClick={() => setViewMode('detailed')}
            size="sm"
          >
            Detailed
          </Button>
        </div>
      </div>

      {viewMode === 'overview' ? (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Category Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Giving Categories</CardTitle>
              <CardDescription>Commitment distribution by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Monthly vs One-time */}
          <Card>
            <CardHeader>
              <CardTitle>Giving Type Distribution</CardTitle>
              <CardDescription>Monthly recurring vs one-time commitments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={monthlyVsOneTimeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {monthlyVsOneTimeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Employment Status of Givers */}
          <Card>
            <CardHeader>
              <CardTitle>Giver Employment Status</CardTitle>
              <CardDescription>Economic background of giving members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={employmentChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Tenure Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Giver Tenure Analysis</CardTitle>
              <CardDescription>Giving by years in church</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tenureChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {tenureChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Year Comparison */}
          {timeRange === 'comparison' && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Year-over-Year Comparison</CardTitle>
                <CardDescription>Commitment growth comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={yearComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="commitments" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        name="Total Commitments"
                        dot={{ fill: "#10b981", strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Detailed Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Category Analysis</CardTitle>
              <CardDescription>Complete breakdown of all giving categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryAnalysis.map((category) => (
                  <div key={category.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">{category.description || 'No description'}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{category.commitmentCount}</div>
                        <div className="text-sm text-muted-foreground">commitments</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Type: <span className="font-semibold text-foreground">{category.isMonthly ? 'Monthly' : 'One-time'}</span>
                      </span>
                      {category.specificMonth && (
                        <span className="text-muted-foreground">
                          Month: <span className="font-semibold text-foreground">{category.specificMonth}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Giver Demographics Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Giver Demographics Summary</CardTitle>
              <CardDescription>Overview of giving member characteristics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <div className="text-3xl font-bold">{givingMemberCount}</div>
                  <div className="text-sm text-muted-foreground">Total Giving Members</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-3xl font-bold">{geographicReach}</div>
                  <div className="text-sm text-muted-foreground">Cities Represented</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-3xl font-bold">{categoryAnalysis.length}</div>
                  <div className="text-sm text-muted-foreground">Giving Categories</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}