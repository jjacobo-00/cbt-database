import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, ChevronRight, User2 } from "lucide-react"

interface RecentMember {
  id: string
  first_name: string
  last_name: string
  contact_number: string | null
  city: string | null
  created_at: Date | null
}

interface RecentMembersTableProps {
  recentMembers: RecentMember[]
}

export function RecentMembersTable({ recentMembers }: RecentMembersTableProps) {
  // Helper to get initials
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // Helper to determine if member is new (last 7 days)
  const isNewMember = (date: Date | null) => {
    if (!date) return false
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return new Date(date) >= sevenDaysAgo
  }

  return (
    <Card className="mt-4 transition-all duration-300 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle>Recent Members</CardTitle>
          <CardDescription>The 5 most recently added members.</CardDescription>
        </div>
        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
          <Users className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop Table View */}
        <div className="hidden md:block rounded-md border overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Member</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Contact</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">City</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Added</th>
                <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentMembers.map((member) => {
                const isNew = isNewMember(member.created_at)
                
                return (
                  <tr key={member.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-xs">
                          {getInitials(member.first_name, member.last_name)}
                        </div>
                        <div className="font-medium flex items-center gap-2">
                          {member.first_name} {member.last_name}
                          {isNew && (
                            <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{member.contact_number || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{member.city || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {member.created_at ? new Date(member.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10 hover:text-primary">
                        <Link href={`/members/${member.id}`}>View Profile</Link>
                      </Button>
                    </td>
                  </tr>
                )
              })}
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

        {/* Mobile Card View (Compact List Tiles) */}
        <div className="flex flex-col md:hidden border rounded-xl bg-card shadow-sm overflow-hidden divide-y mt-4">
          {recentMembers.map((member) => {
            const isNew = isNewMember(member.created_at)
            const initials = getInitials(member.first_name, member.last_name)
            return (
              <Link 
                key={member.id} 
                href={`/members/${member.id}`}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors active:bg-muted/80"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm relative">
                    {initials || <User2 className="h-5 w-5" />}
                    {isNew && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-foreground truncate">
                      {member.first_name} {member.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {member.city || member.contact_number || "No contact info"}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-3" />
              </Link>
            )
          })}
          {!recentMembers.length && (
            <div className="text-center p-8 border rounded-xl bg-card text-muted-foreground">
              No recent members found.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
