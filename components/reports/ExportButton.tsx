"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function ExportButton({ data }: { data: any[] }) {
  const handleExport = () => {
    if (!data || data.length === 0) return

    const headers = Object.keys(data[0]).join(",")
    const rows = data.map(row => 
      Object.values(row).map(value => `"${value || ''}"`).join(",")
    ).join("\n")

    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "cbt_members_export.csv"
    a.click()
  }

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" /> Export CSV
    </Button>
  )
}
