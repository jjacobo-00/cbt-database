"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TablePagination } from "@/components/ui/table-pagination"
import { Download, SlidersHorizontal, User2 } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  filename?: string
}

export function ReportsDataTable<TData, TValue>({
  columns,
  data,
  filename = "reports-export.csv",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination,
    },
  })

  const exportFilteredToCSV = () => {
    // Get all the rows that are currently visible/filtered
    const rows = table.getFilteredRowModel().rows
    
    // Get all visible columns (excluding actions if any)
    const visibleColumns = table.getAllColumns().filter(c => c.getIsVisible() && c.id !== "actions")
    
    const headers = visibleColumns.map(c => {
      // Use column header if it's a string, else fallback to id
      return typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id
    }).map(h => h === "City/Branch" ? "City/Branch Location" : h)
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => {
        return visibleColumns.map(col => {
          let cellValue = row.getValue(col.id)
          // Handle special case for city column to show mission_location first
          if (col.id === "city") {
            cellValue = (row.original as ReportMember).mission_location || cellValue
          }
          // Escape quotes and wrap in quotes if there's a comma
          if (cellValue === null || cellValue === undefined) cellValue = ""
          const stringValue = String(cellValue).replace(/"/g, '""')
          return `"${stringValue}"`
        }).join(",")
      })
    ].join("\n")
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Input
          placeholder="Search all columns..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm w-full"
        />
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-background">
                <SlidersHorizontal className="h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id.replace(/_/g, " ")}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="default" onClick={exportFilteredToCSV} className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-sm border-green-700/50">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
      
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="w-full overflow-auto hidden md:block">
          <Table>
            <TableHeader className="bg-muted/50 border-b">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap font-medium text-foreground py-3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="whitespace-nowrap py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                    No results found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="flex flex-col md:hidden divide-y divide-border">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const firstName = (row.original as any).first_name || ""
              const lastName = (row.original as any).last_name || ""
              const name = `${firstName} ${lastName}`.trim() || "Unknown"
              const gender = (row.original as any).gender || (row.original as any).sex || "-"
              const city = (row.original as any).mission_location || (row.original as any).city || "-"
              
              const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()

              return (
                <div key={row.id} className="p-4 flex flex-col gap-2 bg-card">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                      {initials || <User2 className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">{name}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="truncate">{city}</span> • <span>{gender}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No results found.
            </div>
          )}
        </div>
      </div>

      <TablePagination table={table} entityLabel="records" />
    </div>
  )
}
