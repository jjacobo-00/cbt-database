"use client"

import * as React from "react"
import { format, parseISO, isValid, setYear, setMonth, getDaysInMonth, getDate } from "date-fns"
import { Calendar as CalendarIcon, Grid, CalendarDays } from "lucide-react"

import { cn } from "@/lib/utils/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string | Date | null
  onChange?: (date: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [showYearGrid, setShowYearGrid] = React.useState(false)

  // Convert string (YYYY-MM-DD) or Date to Date object for the Calendar
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date) return value
    const parsed = parseISO(value)
    return isValid(parsed) ? parsed : undefined
  }, [value])

  const [prevDateValue, setPrevDateValue] = React.useState<Date | undefined>(dateValue)
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => dateValue || new Date())

  // Adjust state during render when dateValue prop changes
  if (dateValue !== prevDateValue) {
    setPrevDateValue(dateValue)
    if (dateValue) {
      setCurrentMonth(dateValue)
    }
  }

  // Trigger subtle haptic feedback on mobile if supported
  const triggerHaptic = () => {
    if (typeof window !== "undefined" && window.navigator?.vibrate) {
      try {
        window.navigator.vibrate(10)
      } catch {
        // Safe fallback
      }
    }
  }

  // Handle Year Change while preserving the selected day (clamped to max days of target month)
  const handleYearChange = (newYear: number) => {
    triggerHaptic()
    const newDate = setYear(currentMonth, newYear)
    
    if (dateValue) {
      const selectedDay = getDate(dateValue)
      const maxDays = getDaysInMonth(newDate)
      const targetDay = Math.min(selectedDay, maxDays)
      const updatedSelectedDate = new Date(newYear, newDate.getMonth(), targetDay)
      
      if (onChange) {
        onChange(format(updatedSelectedDate, "yyyy-MM-dd"))
      }
    }
    
    setCurrentMonth(newDate)
    setShowYearGrid(false)
  }

  // Handle Month Change while preserving the selected day
  const handleMonthChange = (newMonthIndex: number) => {
    triggerHaptic()
    const newDate = setMonth(currentMonth, newMonthIndex)
    
    if (dateValue) {
      const selectedDay = getDate(dateValue)
      const maxDays = getDaysInMonth(newDate)
      const targetDay = Math.min(selectedDay, maxDays)
      const updatedSelectedDate = new Date(newDate.getFullYear(), newMonthIndex, targetDay)
      
      if (onChange) {
        onChange(format(updatedSelectedDate, "yyyy-MM-dd"))
      }
    }
    
    setCurrentMonth(newDate)
  }

  const currentYear = currentMonth.getFullYear()
  const yearsList = React.useMemo(() => {
    const years: number[] = []
    const startYear = 1920
    const endYear = new Date().getFullYear() + 20
    for (let y = endYear; y >= startYear; y--) {
      years.push(y)
    }
    return years
  }, [])

  const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-transparent text-base md:text-sm h-11 md:h-10 px-3",
            !dateValue && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          onClick={triggerHaptic}
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-50 shrink-0" />
          <span className="truncate">
            {dateValue ? format(dateValue, "MMMM d, yyyy") : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[320px] sm:w-[350px] p-3 z-[60]" align="start">
        {/* Header Bar with Year -> Month selector order */}
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b">
          <div className="flex items-center gap-1.5">
            {/* Year Selector Dropdown */}
            <div className="relative">
              <select
                value={currentYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="h-9 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer pr-6"
              >
                {yearsList.map((y) => (
                  <option key={y} value={y} className="bg-background text-foreground">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selector Dropdown */}
            <div className="relative">
              <select
                value={currentMonth.getMonth()}
                onChange={(e) => handleMonthChange(Number(e.target.value))}
                className="h-9 rounded-md border bg-muted/60 px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {monthsList.map((m, idx) => (
                  <option key={m} value={idx} className="bg-background text-foreground">
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggle Quick-Year Grid View for Mobile / Fast Decade Scrolling */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowYearGrid(!showYearGrid)}
            className="h-8 px-2 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground"
            title="Toggle Quick Year Grid"
          >
            {showYearGrid ? <CalendarDays className="h-3.5 w-3.5" /> : <Grid className="h-3.5 w-3.5" />}
            <span>{showYearGrid ? "Calendar" : "Years"}</span>
          </Button>
        </div>

        {/* View 1: Quick Year Grid View */}
        {showYearGrid ? (
          <div className="grid grid-cols-4 gap-1.5 max-h-[260px] overflow-y-auto p-1 touch-contain">
            {yearsList.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => handleYearChange(y)}
                className={cn(
                  "h-9 rounded-md text-xs font-medium transition-all flex items-center justify-center border",
                  y === currentYear
                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm"
                    : "hover:bg-accent border-transparent text-foreground"
                )}
              >
                {y}
              </button>
            ))}
          </div>
        ) : (
          /* View 2: Touch-Optimized Calendar View */
          <Calendar
            mode="single"
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            selected={dateValue}
            onSelect={(date) => {
              triggerHaptic()
              if (onChange && date) {
                onChange(format(date, "yyyy-MM-dd"))
              } else if (onChange) {
                onChange("")
              }
              setOpen(false)
            }}
            captionLayout="label"
            startMonth={new Date(1920, 0)}
            endMonth={new Date(2100, 11)}
            className="p-0"
          />
        )}
      </PopoverContent>
    </Popover>
  )
}
