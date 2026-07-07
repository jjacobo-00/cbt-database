import { login } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const resolvedSearchParams = await searchParams;
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-[400px] shadow-lg">
        <CardHeader className="space-y-1 items-center">
          <div className="mb-4 flex items-center justify-center p-2">
            <Image src="/logo.svg" alt="CBT Logo" width={64} height={64} className="object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Enter the master password to access the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={login} className="space-y-4">
            {resolvedSearchParams?.error && (
              <div className="p-3 rounded bg-destructive/15 text-destructive text-sm font-medium">
                {resolvedSearchParams.error}
              </div>
            )}
            <input type="hidden" name="email" value="admin@cbt-database.com" />
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required autoFocus />
            </div>
            <Button className="w-full" type="submit">
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
