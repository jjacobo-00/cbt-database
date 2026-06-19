import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Printer, Edit, ArrowLeft, User, MapPin, Briefcase } from "lucide-react"
import Link from "next/link"

export default async function MemberProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: member, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error || !member) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/members"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Member Profile</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Note: In a Server Component, window.print isn't available. But an anchor element with javascript: protocol works without making a Client Component boundary */}
          <Button variant="outline" asChild>
            <a href="javascript:window.print()"><Printer className="mr-2 h-4 w-4" /> Print</a>
          </Button>
          <Button asChild>
            <Link href={`/members/${member.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit Profile</Link>
          </Button>
        </div>
      </div>

      <div className="print:block text-center hidden mb-8">
        <h1 className="text-3xl font-bold">CBT Directory</h1>
        <h2 className="text-xl">Member Profile</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="print:shadow-none print:border-none">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="bg-primary/10 p-4 rounded-full">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">{member.first_name} {member.last_name}</CardTitle>
              <p className="text-muted-foreground">{member.contact_number}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">City</Label>
                <div className="font-medium flex items-center gap-2 mt-1"><MapPin className="h-4 w-4 text-primary" /> {member.city || "-"}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Occupation</Label>
                <div className="font-medium flex items-center gap-2 mt-1"><Briefcase className="h-4 w-4 text-primary" /> {member.occupation || "-"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
