import { getMinistries } from "./actions"
import { MinistriesClient } from "./MinistriesClient"
import { ChurchIcon } from "lucide-react"

export const metadata = { title: "Ministries | CBT Directory" }

export default async function MinistriesPage() {
  const ministries = await getMinistries()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <ChurchIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ministries</h1>
          <p className="text-muted-foreground text-sm">Manage church ministries available in the member form.</p>
        </div>
      </div>
      <MinistriesClient ministries={ministries} />
    </div>
  )
}
