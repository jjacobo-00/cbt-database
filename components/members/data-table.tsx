"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ChevronRight, User2 } from "lucide-react"
import { TablePagination } from "@/components/ui/table-pagination"
import { getInitials } from "@/lib/utils/format"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
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
    onPaginationChange: setPagination,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
  })

  return (
    <div>
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Search all members..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
      </div>
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border bg-card">
        <div className="w-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map((header) => {
                    return (
                      <th key={header.id} className="h-12 px-4 text-left align-middle font-medium">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4 align-middle whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View (Compact List Tiles) */}
      <div className="flex flex-col md:hidden gap-3 mt-2">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const cells = row.getVisibleCells();
            
            // We use (row.original as any) because TData is generic in this component
            const memberId = (row.original as any).id;
            const firstName = (row.original as any).first_name || "";
            const lastName = (row.original as any).last_name || "";
            const contact = (row.original as any).contact_number || "No contact info";
            const role = (row.original as any).occupation || "Member";
            
            const initials = getInitials(firstName, lastName);

            return (
              <Link 
                key={row.id} 
                href={`/members/${memberId}`}
                className="group relative flex items-center justify-between p-4 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-all active:scale-[0.98] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-4 min-w-0 relative z-10">
                  <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-inner">
                    {initials || <User2 className="h-6 w-6" />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-foreground text-base truncate">
                      {firstName} {lastName}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground truncate bg-muted px-2 py-0.5 rounded-full">
                        {role}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {contact}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center shrink-0 ml-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors relative z-10">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            )
          })
        ) : (
          <div className="text-center p-8 text-muted-foreground border rounded-2xl bg-card">
            No members found.
          </div>
        )}
      </div>
      <TablePagination table={table} entityLabel="members" />
    </div>
  )
}
