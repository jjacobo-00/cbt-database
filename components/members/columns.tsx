"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import Link from "next/link"

export type MemberType = {
  id: string
  first_name: string
  last_name: string
  contact_number: string | null
  city: string | null
  occupation: string | null
  created_at: string
}

export const columns: ColumnDef<MemberType>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    // We add a custom global filter accessor
    accessorFn: (row) => `${row.first_name} ${row.last_name}`,
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {row.original.first_name} {row.original.last_name}
        </div>
      )
    },
  },
  {
    accessorKey: "contact_number",
    header: "Contact",
    cell: ({ row }) => <div>{row.getValue("contact_number") || "-"}</div>,
  },
  {
    accessorKey: "occupation",
    header: "Occupation",
    cell: ({ row }) => <div>{row.getValue("occupation") || "-"}</div>,
  },
  {
    accessorKey: "city",
    header: "City",
    cell: ({ row }) => <div>{row.getValue("city") || "-"}</div>,
  },
  {
    accessorKey: "created_at",
    header: "Date Added",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return <div>{date.toLocaleDateString()}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const member = row.original
      return (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/members/${member.id}`}>View Profile</Link>
          </Button>
        </div>
      )
    },
  },
]
