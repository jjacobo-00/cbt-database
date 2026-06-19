import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExportButton } from "@/components/reports/ExportButton"

export default async function ReportsPage() {
  const supabase = await createClient()

  // Fetch data for reports and export
  const { data: members } = await supabase.from("members").select("first_name, last_name, sex, city, occupation, contact_number, created_at")
  
  // Aggregate data
  const cityCount = members?.reduce((acc, curr) => {
    const city = curr.city || "Unknown"
    acc[city] = (acc[city] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const sortedCities = Object.entries(cityCount || {}).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <ExportButton data={members || []} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Members by City</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {sortedCities.map(([city, count]) => (
                <li key={city} className="flex justify-between items-center p-2 rounded hover:bg-muted/50 border-b last:border-0">
                  <span className="font-medium text-muted-foreground">{city}</span>
                  <span className="font-bold">{count}</span>
                </li>
              ))}
              {sortedCities.length === 0 && <p className="text-muted-foreground text-sm">No data available.</p>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
