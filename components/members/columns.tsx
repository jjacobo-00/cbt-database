"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal, Pencil, Eye } from "lucide-react"
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

import { GenerateInviteLinkButton } from "@/components/members/GenerateInviteLinkButton"

export const columns: ColumnDef<MemberType>[] = [
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const member = row.original
      return (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/members/${member.id}`}>
              <Eye className="h-3.5 w-3.5 mr-1" />
              View
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="border-primary/40 text-primary hover:bg-primary/10">
            <Link href={`/members/${member.id}/edit`}>
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Link>
          </Button>
          <GenerateInviteLinkButton memberId={member.id} variant="outline" />
        </div>
      )
    },
  },
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
]
