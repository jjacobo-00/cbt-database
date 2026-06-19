import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield } from "lucide-react"
import { createStaff } from "./actions"

export default async function StaffPage() {
  const supabase = await createClient()

  // Verify Admin role
  const { data: { user } } = await supabase.auth.getUser()
  const { data: userProfile } = await supabase.from("users").select("role").eq("id", user?.id).single()

  const isAdmin = userProfile?.role === "Admin"

  if (!isAdmin && user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <Shield className="h-16 w-16 text-destructive opacity-80" />
        <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-muted-foreground max-w-md">Only administrators can manage staff accounts. Please contact an admin if you believe you should have access.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-full">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Staff Account</CardTitle>
          <CardDescription>Add a new member to the church staff. This will send them an invite or let them log in directly with the provided credentials.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createStaff} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="staff@church.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Temporary Password</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>
            <Button type="submit">Create Account</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
