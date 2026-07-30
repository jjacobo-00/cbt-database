"use client"

import { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { cn } from "@/lib/utils/utils"

interface TablePaginationProps<TData> {
  table: Table<TData>
  entityLabel?: string
}

export function TablePagination<TData>({ table, entityLabel = "records" }: TablePaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const totalRows = table.getFilteredRowModel().rows.length
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows)
  const pageCount = table.getPageCount() || 1

  const getPageNumbers = () => {
    const maxVisible = 5
    let start = Math.max(0, pageIndex - Math.floor(maxVisible / 2))
    let end = start + maxVisible
    if (end > pageCount) {
      end = pageCount
      start = Math.max(0, end - maxVisible)
    }
    const pages = []
    for (let i = start; i < end; i++) {
      pages.push(i)
    }
    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 mt-2 border-t text-sm">
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-muted-foreground w-full sm:w-auto">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">Rows per page:</span>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px] text-xs bg-background">
              <SelectValue placeholder={`${pageSize}`} />
            </SelectTrigger>
            <SelectContent align="start">
              {[10, 25, 50, 100].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span className="text-xs font-medium">
          Showing <strong className="text-foreground">{startRow}–{endRow}</strong> of{" "}
          <strong className="text-foreground">{totalRows}</strong> {entityLabel}
        </span>
      </div>

      <div className="flex items-center gap-1.5 justify-center w-full sm:w-auto overflow-x-auto py-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          className="h-8 w-8 text-xs shrink-0"
          title="First Page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="h-8 w-8 text-xs shrink-0"
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 hidden sm:flex">
          {getPageNumbers().map((pageI) => (
            <Button
              key={pageI}
              variant={pageI === pageIndex ? "default" : "outline"}
              size="sm"
              onClick={() => table.setPageIndex(pageI)}
              className={cn(
                "h-8 w-8 p-0 text-xs shrink-0 font-medium",
                pageI === pageIndex && "bg-primary text-primary-foreground font-bold shadow-xs"
              )}
            >
              {pageI + 1}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="h-8 w-8 text-xs shrink-0"
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => table.setPageIndex(pageCount - 1)}
          disabled={!table.getCanNextPage()}
          className="h-8 w-8 text-xs shrink-0"
          title="Last Page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
