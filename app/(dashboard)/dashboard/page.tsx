import { db } from "@/db"
import { members, ministries } from "@/db/schema"
import { eq, isNotNull, desc, sql } from "drizzle-orm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, FileText, Activity } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  // Fetch counts in parallel
  const [
    totalMembersResult,
    totalMalesResult,
    totalFemalesResult,
    totalBaptizedResult,
    totalMinistriesResult,
    recentMembers
  ] = await Promise.all([
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(members),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(members).where(eq(members.sex, "Male")),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(members).where(eq(members.sex, "Female")),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(members).where(isNotNull(members.date_baptized)),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(ministries),
    db.select({
      id: members.id,
      first_name: members.first_name,
      last_name: members.last_name,
      contact_number: members.contact_number,
      city: members.city,
      created_at: members.created_at
    }).from(members).orderBy(desc(members.created_at)).limit(5)
  ])

  const totalMembers = totalMembersResult[0]?.count || 0
  const totalMales = totalMalesResult[0]?.count || 0
  const totalFemales = totalFemalesResult[0]?.count || 0
  const totalBaptized = totalBaptizedResult[0]?.count || 0
  const totalMinistries = totalMinistriesResult[0]?.count || 0

  const malePercentage = totalMembers ? Math.round((totalMales / totalMembers) * 100) : 0
  const femalePercentage = totalMembers ? Math.round((totalFemales / totalMembers) * 100) : 0
  const baptizedPercentage = totalMembers ? Math.round((totalBaptized / totalMembers) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/members/new"><UserPlus className="mr-2 h-4 w-4" /> Add Member</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/reports"><FileText className="mr-2 h-4 w-4" /> Reports</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">Registered in the database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gender Ratio</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{malePercentage}% M / {femalePercentage}% F</div>
            <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden flex">
              <div className="bg-primary h-full" style={{ width: `${malePercentage}%` }} />
              <div className="bg-destructive h-full" style={{ width: `${femalePercentage}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Baptized</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{baptizedPercentage}%</div>
            <p className="text-xs text-muted-foreground">{totalBaptized} members baptized</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Ministries</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMinistries}</div>
            <p className="text-xs text-muted-foreground">Available to join</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Members</CardTitle>
          <CardDescription>The 5 most recently added members.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Name</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Contact</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">City</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Added</th>
                  <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentMembers.map((member) => (
                  <tr key={member.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{member.first_name} {member.last_name}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{member.contact_number || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{member.city || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {member.created_at ? new Date(member.created_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/members/${member.id}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {!recentMembers.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
