import { db } from "@/db"
import { org_chart_nodes, members } from "@/db/schema"
import { OrgChartClient } from "@/components/org-chart/OrgChartClient"
import { Network } from "lucide-react"

export default async function OrgChartPage() {
  // Fetch all org chart nodes
  const nodes = await db.select().from(org_chart_nodes).orderBy(org_chart_nodes.sort_order)
  
  // Fetch all members for the assignment dropdown
  const allMembers = await db.select({
    id: members.id,
    first_name: members.first_name,
    last_name: members.last_name,
  }).from(members).orderBy(members.last_name)

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-lg">
            <Network className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Organizational Chart</h1>
            <p className="text-sm text-muted-foreground">Manage the leadership and members hierarchy</p>
          </div>
        </div>
      </div>

      <OrgChartClient initialNodes={nodes} members={allMembers} />
    </div>
  )
}
