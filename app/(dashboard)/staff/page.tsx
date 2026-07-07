import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"

export default async function StaffPage() {
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
          <CardTitle>Master Password Active</CardTitle>
          <CardDescription>Authentication for this dashboard is currently managed via a single Master Password. Individual staff accounts are not required.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">If you need to add individual role-based staff accounts, consider configuring NextAuth or Neon Auth.</p>
        </CardContent>
      </Card>
    </div>
  )
}
