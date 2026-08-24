"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Pencil, Eye, Cake } from "lucide-react"
import { formatName, formatBirthday, formatFullName, formatSuffix, calculateAge } from "@/lib/utils/utils"
import { GenerateInviteLinkButton } from "@/components/members/GenerateInviteLinkButton"

export type MemberType = {
  id: string
  first_name: string
  last_name: string
  middle_name?: string | null
  suffix?: string | null
  church_role?: string | null
  contact_number: string | null
  city: string | null
  occupation: string | null
  birth_date?: string | null
  age?: number | null
  gender?: string | null
  sex?: string | null
  marital_status?: string | null
  mission_id?: string | null
  mission_name?: string | null
  date_baptized?: string | null
  baptism_date?: string | null
  membership_date?: string | null
  last_login_at?: string | null
  created_at: string
}

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
    accessorFn: (row) => formatFullName(row),
    cell: ({ row }) => {
      const member = row.original
      const firstName = formatName(member.first_name || "")
      const lastName = formatName(member.last_name || "")
      const middleName = member.middle_name ? formatName(member.middle_name) : ""
      const middleInitial = middleName ? `${middleName.charAt(0)}.` : ""
      const suffix = formatSuffix(member.suffix)
      const baseName = `${firstName} ${lastName}`
      
      const age = member.age ?? calculateAge(member.birth_date)
      const birthYear = member.birth_date ? String(member.birth_date).split("T")[0].split("-")[0] : null
      const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()

      return (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
              <span>{baseName}</span>
              {suffix && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-bold bg-primary/15 text-primary border border-primary/30 shrink-0">
                  {suffix}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {middleInitial && <span>{middleInitial}</span>}
              {middleInitial && (age !== null || member.church_role) && <span>•</span>}
              {age !== null ? (
                <span>{age} yrs old{birthYear ? ` (${birthYear})` : ""}</span>
              ) : member.church_role && member.church_role !== "Member" ? (
                <span className="text-primary/80 font-medium">{member.church_role}</span>
              ) : null}
            </div>
          </div>
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
    accessorKey: "birth_date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-pink-500/10 hover:text-pink-600 dark:hover:text-pink-400"
        >
          <Cake className="mr-1.5 h-3.5 w-3.5 text-pink-500" />
          Birthday
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    sortingFn: (rowA, rowB) => {
      const getDayOfYear = (dStr?: string | null) => {
        if (!dStr) return 9999
        const parts = String(dStr).split("T")[0].split("-")
        if (parts.length === 3) {
          const m = parseInt(parts[1], 10)
          const d = parseInt(parts[2], 10)
          if (!isNaN(m) && !isNaN(d)) return m * 100 + d
        }
        const d = new Date(dStr)
        if (isNaN(d.getTime())) return 9999
        return (d.getMonth() + 1) * 100 + d.getDate()
      }
      return getDayOfYear(rowA.original.birth_date) - getDayOfYear(rowB.original.birth_date)
    },
    cell: ({ row }) => {
      const bDate = row.original.birth_date
      if (!bDate) return <span className="text-muted-foreground text-xs italic">-</span>
      const formatted = formatBirthday(bDate)
      return (
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Cake className="h-3.5 w-3.5 text-pink-500/80 shrink-0" />
          <span>{formatted}</span>
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
