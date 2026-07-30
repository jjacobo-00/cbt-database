"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReportMember } from "./page"

export const columns: ColumnDef<ReportMember>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 hover:bg-transparent"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const first = row.original.first_name || ""
      const last = row.original.last_name || ""
      return <div className="font-medium">{`${first} ${last}`}</div>
    },
    // We add a custom filter fn if needed, but default works on strings. 
    // To allow searching by name, we set an accessor that returns the full name.
    accessorFn: (row) => `${row.first_name} ${row.last_name}`,
  },
  {
    accessorKey: "gender",
    header: "Gender",
    cell: ({ row }) => (row.original as any).gender || row.original.sex || "-",
  },
  {
    accessorKey: "age",
    header: "Age",
    cell: ({ row }) => row.original.age || "-",
  },
  {
    accessorKey: "city",
    header: "City",
    cell: ({ row }) => row.original.city || "-",
  },
  {
    accessorKey: "marital_status",
    header: "Marital Status",
    cell: ({ row }) => row.original.marital_status || "-",
  },
  {
    accessorKey: "highest_educational_attainment",
    header: "Education",
    cell: ({ row }) => row.original.highest_educational_attainment || "-",
  },
  {
    accessorKey: "occupation",
    header: "Employment / Occupation",
    cell: ({ row }) => {
      if (row.original.employment_status === "Student") return "Student"
      return row.original.occupation || row.original.employment_status || "-"
    },
  },
  {
    accessorKey: "baptism_status",
    header: "Baptism Status",
    accessorFn: (row) => row.date_baptized ? "Baptized" : "Unbaptized",
  },
  {
    accessorKey: "membership_date",
    header: "Date Registered",
    cell: ({ row }) => row.original.membership_date ? new Date(row.original.membership_date).toLocaleDateString() : "-",
  },
]
