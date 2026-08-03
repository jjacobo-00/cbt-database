import { getMinistries } from "./actions"
import { getMembersList } from "@/app/(dashboard)/members/actions"
import { MinistriesClient } from "./MinistriesClient"
import { ChurchIcon } from "lucide-react"

export const metadata = { title: "Ministries | CBT Database" }

export default async function MinistriesPage() {
  const [ministries, members] = await Promise.all([
    getMinistries(),
    getMembersList()
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <ChurchIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ministries</h1>
          <p className="text-muted-foreground text-sm">Manage church ministries and assign ministry leaders from members.</p>
        </div>
      </div>
      <MinistriesClient ministries={ministries} members={members} />
    </div>
  )
}
