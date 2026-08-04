import { getWhitelistedUsers, removeWhitelistedUser } from "./actions"
import { getMembersList } from "@/app/(dashboard)/members/actions"
import { AddUserClient } from "@/components/users/AddUserClient"
import { UserListClient } from "@/components/users/UserListClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, UserCheck, Shield } from "lucide-react"

export default async function UsersPage() {
  const users = await getWhitelistedUsers()
  const members = await getMembersList()

  return (
    <div className="flex-1 space-y-4 p-2 sm:p-4 md:p-8 pt-4 sm:pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Users</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full border-primary/20 shadow-md">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Whitelisted Google Accounts</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Only these email addresses are permitted to log in to the database via Google OAuth.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <AddUserClient members={members} />
            <UserListClient users={users} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
