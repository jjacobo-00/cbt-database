"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal, Pencil, Eye } from "lucide-react"
import Link from "next/link"
import { formatName } from "@/lib/utils/utils"

export type MemberType = {
  id: string
  first_name: string
  last_name: string
  church_role?: string | null
  contact_number: string | null
  city: string | null
  occupation: string | null
  mission_name?: string | null
  date_baptized?: string | null
  baptism_date?: string | null
  last_login_at?: string | null
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
    accessorFn: (row) => formatName(`${row.first_name} ${row.last_name}`),
    cell: ({ row }) => {
      const fullName = formatName(`${row.original.first_name} ${row.original.last_name}`)
      return (
        <div className="font-medium flex items-center gap-2">
          <span>{fullName}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "mission_name",
    header: "Mission Branch",
    cell: ({ row }) => {
      const missionName = row.original.mission_name || "CBT Olongapo"
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
          {missionName}
        </span>
      )
    },
  },
  {
    accessorKey: "church_role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.original.church_role || "Member"
      if (role === "Main Pastor") {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">Main Pastor</span>
      }
      if (role === "Mission Pastor") {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30">Mission Pastor</span>
      }
      if (role === "Ministry Leader") {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30">Ministry Leader</span>
      }
      return <span className="text-muted-foreground text-xs">{role}</span>
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
    accessorKey: "last_login_at",
    header: "Last Login",
    cell: ({ row }) => {
      const val = row.original.last_login_at
      if (!val) return <span className="text-muted-foreground text-xs italic">Never</span>
      const date = new Date(val)
      if (isNaN(date.getTime())) return <span className="text-muted-foreground text-xs italic">Never</span>
      return (
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
          {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </span>
      )
    },
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
