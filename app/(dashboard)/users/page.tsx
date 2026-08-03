import { getWhitelistedUsers, removeWhitelistedUser } from "./actions"
import { getMembersList } from "@/app/(dashboard)/members/actions"
import { AddUserClient } from "@/components/users/AddUserClient"
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

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border bg-card overflow-hidden">
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
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
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

            {/* Mobile Touch Card List View */}
            <div className="flex flex-col md:hidden gap-3 mt-3">
              {users.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground border rounded-xl bg-card text-sm">
                  No users whitelisted yet.
                </div>
              ) : (
                users.map((user) => {
                  const initial = (user.name || user.email || "U").charAt(0).toUpperCase()
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-card border shadow-xs gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                          {initial}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-foreground text-sm truncate">
                            {user.name || "Whitelisted User"}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">
                            Added: {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                          </span>
                        </div>
                      </div>

                      <form action={async () => {
                        "use server"
                        await removeWhitelistedUser(user.id)
                      }} className="shrink-0">
                        <Button size="sm" variant="destructive" type="submit" className="h-9 w-9 p-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
