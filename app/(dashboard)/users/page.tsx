import { getWhitelistedUsers, getMemberPermissionsList, getDemographicMinistriesList } from "./actions"
import { getMembersList } from "@/app/(dashboard)/members/actions"
import { AddUserClient } from "@/components/users/AddUserClient"
import { UserListClient } from "@/components/users/UserListClient"
import { MemberPermissionsClient } from "@/components/users/MemberPermissionsClient"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, UserCheck, Users, Shield } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const metadata = { title: "Users & Permissions | CBT Database" }

export default async function UsersPage() {
  const [users, members, permissionsList, demographicMinistries] = await Promise.all([
    getWhitelistedUsers(),
    getMembersList(),
    getMemberPermissionsList(),
    getDemographicMinistriesList(),
  ])

  return (
    <div className="flex-1 space-y-6 p-3 sm:p-6 md:p-8 pt-4 sm:pt-6 max-w-7xl mx-auto">
      {/* 🟢 Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ShieldCheck className="h-7 w-7 text-primary" />
            Users & Permissions
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage full system administrators and delegated member access for demographic ministries.
          </p>
        </div>
      </div>

      {/* 🟢 Tabs Navigation */}
      <Tabs defaultValue="delegated" className="space-y-6">
        <TabsList className="grid w-full sm:w-auto grid-cols-2 h-11 p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="delegated" className="flex items-center gap-2 text-xs sm:text-sm font-semibold rounded-lg">
            <UserCheck className="h-4 w-4 text-primary" />
            <span>Member Permissions</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-primary/10 text-primary font-bold">
              {permissionsList.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex items-center gap-2 text-xs sm:text-sm font-semibold rounded-lg">
            <Shield className="h-4 w-4 text-primary" />
            <span>Super Administrators</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-muted text-muted-foreground font-bold">
              {users.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Member Permissions (Delegated Access) */}
        <TabsContent value="delegated" className="space-y-4 focus-visible:outline-none">
          <MemberPermissionsClient
            permissionsList={permissionsList}
            allMembers={members}
            demographicMinistries={demographicMinistries}
          />
        </TabsContent>

        {/* Tab 2: Super Administrators (Whitelisted Google Accounts) */}
        <TabsContent value="admins" className="space-y-4 focus-visible:outline-none">
          <Card className="border shadow-sm">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Whitelisted Google Accounts
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                These authorized email addresses possess unrestricted full system administrator privileges via Google OAuth.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <AddUserClient members={members} />
              <UserListClient users={users} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
