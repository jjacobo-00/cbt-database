import { getMissions } from "./actions"
import { MissionsClient } from "./MissionsClient"
import { MapPin } from "lucide-react"
import { db } from "@/db"
import { members } from "@/db/schema"
import { asc } from "drizzle-orm"

export const metadata = { title: "Missions | CBT Database" }

export default async function MissionsPage() {
  const missionsList = await getMissions()
  const membersList = await db.select({ 
    id: members.id, 
    first_name: members.first_name, 
    last_name: members.last_name 
  }).from(members).orderBy(asc(members.last_name))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mission Churches</h1>
          <p className="text-muted-foreground mt-1">Manage mission churches, locations, and their designated pastors.</p>
        </div>
        <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
          <MapPin className="h-6 w-6" />
        </div>
      </div>
      
      <MissionsClient initialMissions={missionsList} members={membersList} />
    </div>
  )
}
