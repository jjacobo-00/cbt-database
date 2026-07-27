import { getWhitelistedUsers, addWhitelistedUser, removeWhitelistedUser } from "./actions"
import { getMembersList } from "@/app/(dashboard)/members/actions"
import { AddUserClient } from "@/components/users/AddUserClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, UserPlus } from "lucide-react"

export default async function UsersPage() {
  const users = await getWhitelistedUsers()
  const members = await getMembersList()

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Users</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full border-primary/20 shadow-md">
          <CardHeader>
            <CardTitle>Whitelisted Google Accounts</CardTitle>
            <CardDescription>
              Only these email addresses are permitted to log in to the database via Google OAuth.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddUserClient members={members} />

            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Email Address</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No users whitelisted yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.name || "-"}</TableCell>
                        <TableCell>
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell>
                          <form action={async () => {
                            "use server"
                            await removeWhitelistedUser(user.id)
                          }}>
                            <Button size="sm" variant="destructive" type="submit">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
