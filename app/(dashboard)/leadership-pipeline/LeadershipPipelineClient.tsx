"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell, ScatterChart, Scatter
} from "recharts"
import { 
  Users, Crown, TrendingUp, Award, UserCheck, Shield, 
  Filter, Download, Eye, EyeOff, Star 
} from "lucide-react"

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16']

interface LeadershipCandidate {
  id: string
  first_name: string
  last_name: string
  age: number | null
  city: string | null
  occupation: string | null
  employment_status: string | null
  highest_educational_attainment: string | null
  years_in_church: number | null
  membership_date: string | null
  date_baptized: string | null
  church_role: string | null
  leadershipScore: number
  leadershipLevel: 'potential' | 'emerging' | 'established' | 'senior'
  ministryCount: number
  ministryNames: (string | null)[]
  currentPosition: string | null
  isCurrentlyInLeadership: boolean
  created_at: string | null
}

interface LeadershipPipelineClientProps {
  candidates: LeadershipCandidate[]
  ageGroups: {
    young: number
    mid: number
    senior: number
  }
  tenureGroups: {
    new: number
    growing: number
    mature: number
  }
  totalMinistries: number
}

export function LeadershipPipelineClient({ 
  candidates, 
  ageGroups, 
  tenureGroups,
  totalMinistries
}: LeadershipPipelineClientProps) {
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview')
  const [filterLevel, setFilterLevel] = useState<'all' | 'emerging' | 'established' | 'senior'>('all')
  const [selectedCandidate, setSelectedCandidate] = useState<LeadershipCandidate | null>(null)

  const filteredCandidates = useMemo(() => {
    if (filterLevel === 'all') return candidates
    return candidates.filter(c => c.leadershipLevel === filterLevel)
  }, [candidates, filterLevel])

  // Prepare data for charts
  const leadershipLevelDistribution = useMemo(() => {
    const distribution = {
      emerging: candidates.filter(c => c.leadershipLevel === 'emerging').length,
      established: candidates.filter(c => c.leadershipLevel === 'established').length,
      senior: candidates.filter(c => c.leadershipLevel === 'senior').length,
    }
    return Object.entries(distribution).map(([name, value]) => ({ name, value }))
  }, [candidates])

  const topCandidates = useMemo(() => {
    return candidates.slice(0, 10).map(c => ({
      name: `${c.first_name} ${c.last_name}`.length > 15 ? 
        `${c.first_name} ${c.last_name}`.substring(0, 15) + '...' : 
        `${c.first_name} ${c.last_name}`,
      score: c.leadershipScore,
      level: c.leadershipLevel,
      ministries: c.ministryCount
    }))
  }, [candidates])

  const ageDistributionData = useMemo(() => {
    return [
      { name: 'Young (≤35)', value: ageGroups.young },
      { name: 'Mid (36-55)', value: ageGroups.mid },
      { name: 'Senior (55+)', value: ageGroups.senior },
    ].filter(d => d.value > 0)
  }, [ageGroups])

  const tenureDistributionData = useMemo(() => {
    return [
      { name: 'New (≤2 yrs)', value: tenureGroups.new },
      { name: 'Growing (2-5 yrs)', value: tenureGroups.growing },
      { name: 'Mature (5+ yrs)', value: tenureGroups.mature },
    ].filter(d => d.value > 0)
  }, [tenureGroups])

  const scoreDistribution = useMemo(() => {
    const ranges = {
      '40-49': 0,
      '50-59': 0,
      '60-69': 0,
      '70-79': 0,
      '80-89': 0,
      '90-100': 0,
    }
    candidates.forEach(c => {
      const score = c.leadershipScore
      if (score >= 40 && score < 50) ranges['40-49']++
      else if (score >= 50 && score < 60) ranges['50-59']++
      else if (score >= 60 && score < 70) ranges['60-69']++
      else if (score >= 70 && score < 80) ranges['70-79']++
      else if (score >= 80 && score < 90) ranges['80-89']++
      else if (score >= 90) ranges['90-100']++
    })
    return Object.entries(ranges).map(([name, value]) => ({ name, value })).filter(d => d.value > 0)
  }, [candidates])

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'emerging': return 'text-green-500'
      case 'established': return 'text-purple-500'
      case 'senior': return 'text-amber-500'
      default: return 'text-gray-500'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'emerging': return <TrendingUp className="h-4 w-4" />
      case 'established': return <Award className="h-4 w-4" />
      case 'senior': return <Crown className="h-4 w-4" />
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select 
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as any)}
            className="h-10 rounded-lg border border-input bg-card text-foreground px-4 shadow-sm"
          >
            <option value="all">All Levels</option>
            <option value="emerging">Emerging</option>
            <option value="established">Established</option>
            <option value="senior">Senior</option>
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
          {/* Leadership Level Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Leadership Level Distribution</CardTitle>
              <CardDescription>Current pipeline stage distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadershipLevelDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {leadershipLevelDistribution.map((entry, index) => (
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

          {/* Top Candidates */}
          <Card>
            <CardHeader>
              <CardTitle>Top Leadership Candidates</CardTitle>
              <CardDescription>Highest scoring potential leaders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCandidates} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Age Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Age Distribution</CardTitle>
              <CardDescription>Age groups of leadership candidates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ageDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {ageDistributionData.map((entry, index) => (
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

          {/* Tenure Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Tenure Distribution</CardTitle>
              <CardDescription>Years in church of candidates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tenureDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Score Distribution */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Leadership Score Distribution</CardTitle>
          <CardDescription>Distribution of leadership potential scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  ) : (
    <div className="space-y-4">
      {/* Detailed Candidate List */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Candidate Analysis</CardTitle>
          <CardDescription>Click on a candidate to see detailed breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCandidates.map((candidate) => (
              <div 
                key={candidate.id}
                className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setSelectedCandidate(candidate)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getLevelColor(candidate.leadershipLevel)} bg-current/10`}>
                      {getLevelIcon(candidate.leadershipLevel)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{candidate.first_name} {candidate.last_name}</h3>
                      <p className="text-sm text-muted-foreground">{candidate.occupation || 'No occupation listed'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{candidate.leadershipScore}</div>
                    <div className="text-sm text-muted-foreground">leadership score</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Level: <span className={`font-semibold ${getLevelColor(candidate.leadershipLevel)}`}>
                      {candidate.leadershipLevel}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    Ministries: <span className="font-semibold text-foreground">{candidate.ministryCount}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Tenure: <span className="font-semibold text-foreground">{candidate.years_in_church || 0} years</span>
                  </span>
                  {candidate.isCurrentlyInLeadership && (
                    <span className="text-muted-foreground">
                      Position: <span className="font-semibold text-foreground">{candidate.currentPosition}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Candidate Details */}
      {selectedCandidate && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedCandidate.first_name} {selectedCandidate.last_name} - Leadership Profile</CardTitle>
            <CardDescription>Comprehensive leadership assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Leadership Score Breakdown */}
              <div>
                <h4 className="font-semibold mb-3">Leadership Score: {selectedCandidate.leadershipScore}/100</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Church Tenure</span>
                    <span className="font-semibold">{Math.min((selectedCandidate.years_in_church || 0) * 5, 25)}/25</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Ministry Involvement</span>
                    <span className="font-semibold">{Math.min(selectedCandidate.ministryCount * 10, 30)}/30</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Spiritual Maturity</span>
                    <span className="font-semibold">
                      {(selectedCandidate.date_baptized ? 10 : 0) + 
                       (selectedCandidate.membership_date ? 5 : 0) + 
                       (selectedCandidate.church_role !== 'Member' ? 10 : 0)}/25
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Current Leadership</span>
                    <span className="font-semibold">{selectedCandidate.isCurrentlyInLeadership ? 20 : 0}/20</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Education</span>
                    <span className="font-semibold">
                      {selectedCandidate.highest_educational_attainment ? 
                        (selectedCandidate.highest_educational_attainment.toLowerCase().includes('master') || 
                         selectedCandidate.highest_educational_attainment.toLowerCase().includes('doctor') ? 10 : 5) : 0}/10
                    </span>
                  </div>
                </div>
              </div>

              {/* Ministry Involvement */}
              <div>
                <h4 className="font-semibold mb-3">Ministry Involvement</h4>
                <div className="space-y-2">
                  {selectedCandidate.ministryNames.length > 0 ? (
                    selectedCandidate.ministryNames.filter(Boolean).map((ministry, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="text-sm">{ministry}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No ministry involvement recorded</p>
                  )}
                </div>
              </div>

              {/* Background Information */}
              <div>
                <h4 className="font-semibold mb-3">Background Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Age</span>
                    <span className="font-semibold">{selectedCandidate.age || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Location</span>
                    <span className="font-semibold">{selectedCandidate.city || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Employment</span>
                    <span className="font-semibold">{selectedCandidate.employment_status || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Education</span>
                    <span className="font-semibold">{selectedCandidate.highest_educational_attainment || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {/* Current Position */}
              <div>
                <h4 className="font-semibold mb-3">Current Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Leadership Level</span>
                    <span className={`font-semibold ${getLevelColor(selectedCandidate.leadershipLevel)}`}>
                      {selectedCandidate.leadershipLevel}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Current Position</span>
                    <span className="font-semibold">{selectedCandidate.currentPosition || 'None'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Church Role</span>
                    <span className="font-semibold">{selectedCandidate.church_role || 'Member'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setSelectedCandidate(null)}
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
)
}