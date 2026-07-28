import { getMissions } from "./actions"
import { MissionsClient } from "./MissionsClient"
import { MapPin } from "lucide-react"

export const metadata = { title: "Missions | CBT Database" }

export default async function MissionsPage() {
  const missions = await getMissions()

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
      
      <MissionsClient initialMissions={missions} />
    </div>
  )
}
