"use client"

import * as React from "react"
import { format, parseISO, isValid, setYear, setMonth } from "date-fns"
import { Calendar as CalendarIcon, Grid, CalendarDays, X, Check } from "lucide-react"

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
  minYear?: number
  maxYear?: number
  showClear?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled,
  minYear = 1900,
  maxYear = new Date().getFullYear() + 20,
  showClear = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [showYearGrid, setShowYearGrid] = React.useState(false)
  const yearGridRef = React.useRef<HTMLDivElement>(null)

  // Convert string (YYYY-MM-DD) or Date to Date object for the Calendar
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date) return value
    const parsed = parseISO(value)
    return isValid(parsed) ? parsed : undefined
  }, [value])

  const [prevDateValue, setPrevDateValue] = React.useState<Date | undefined>(dateValue)
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => dateValue || new Date())

  // Adjust view state when dateValue prop changes
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

  // Handle Year Change — Updates view state only (does NOT mutate form data until day is picked)
  const handleYearChange = (newYear: number) => {
    triggerHaptic()
    const newDate = setYear(currentMonth, newYear)
    setCurrentMonth(newDate)
    setShowYearGrid(false)
  }

  // Handle Month Change — Updates view state only
  const handleMonthChange = (newMonthIndex: number) => {
    triggerHaptic()
    const newDate = setMonth(currentMonth, newMonthIndex)
    setCurrentMonth(newDate)
  }

  const currentYear = currentMonth.getFullYear()
  const yearsList = React.useMemo(() => {
    const years: number[] = []
    for (let y = maxYear; y >= minYear; y--) {
      years.push(y)
    }
    return years
  }, [minYear, maxYear])

  const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  // Auto-scroll year grid to current active year when grid opens
  React.useEffect(() => {
    if (showYearGrid && yearGridRef.current) {
      const activeEl = yearGridRef.current.querySelector('[data-selected="true"]')
      if (activeEl) {
        activeEl.scrollIntoView({ block: "center", behavior: "smooth" })
      }
    }
  }, [showYearGrid])

  const handleSelectToday = () => {
    triggerHaptic()
    const today = new Date()
    setCurrentMonth(today)
    if (onChange) {
      onChange(format(today, "yyyy-MM-dd"))
    }
    setOpen(false)
  }

  const handleClearDate = () => {
    triggerHaptic()
    if (onChange) {
      onChange("")
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-label={dateValue ? `Selected date: ${format(dateValue, "MMMM d, yyyy")}` : placeholder}
          className={cn(
            "w-full justify-start text-left font-normal bg-transparent text-base md:text-sm h-11 md:h-10 px-3 transition-colors",
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
      
      <PopoverContent className="w-[calc(100vw-2rem)] max-w-[340px] sm:w-[340px] p-3 z-[60] shadow-xl rounded-xl border bg-popover text-popover-foreground" align="start">
        {/* Header Bar with Year & Month selectors */}
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Year Selector Dropdown */}
            <select
              aria-label="Select Year"
              value={currentYear}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className="h-9 rounded-lg border bg-muted/60 hover:bg-muted px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-colors"
            >
              {yearsList.map((y) => (
                <option key={y} value={y} className="bg-background text-foreground">
                  {y}
                </option>
              ))}
            </select>

            {/* Month Selector Dropdown */}
            <select
              aria-label="Select Month"
              value={currentMonth.getMonth()}
              onChange={(e) => handleMonthChange(Number(e.target.value))}
              className="h-9 rounded-lg border bg-muted/60 hover:bg-muted px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-colors"
            >
              {monthsList.map((m, idx) => (
                <option key={m} value={idx} className="bg-background text-foreground">
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Quick-Year Grid View */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={showYearGrid ? "Switch to Calendar view" : "Switch to Year Grid view"}
            onClick={() => setShowYearGrid(!showYearGrid)}
            className="h-9 px-2 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground shrink-0"
          >
            {showYearGrid ? <CalendarDays className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            <span className="hidden sm:inline">{showYearGrid ? "Calendar" : "Years"}</span>
          </Button>
        </div>

        {/* View 1: Quick Year Grid View */}
        {showYearGrid ? (
          <div 
            ref={yearGridRef}
            className="grid grid-cols-4 gap-1.5 max-h-[240px] overflow-y-auto p-1 touch-contain scroll-smooth"
          >
            {yearsList.map((y) => (
              <button
                key={y}
                type="button"
                data-selected={y === currentYear}
                onClick={() => handleYearChange(y)}
                className={cn(
                  "h-10 rounded-lg text-xs font-medium transition-all flex items-center justify-center border select-none active:scale-95",
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
            startMonth={new Date(minYear, 0)}
            endMonth={new Date(maxYear, 11)}
            className="p-0"
          />
        )}

        {/* Footer Shortcuts: Today & Clear */}
        <div className="flex items-center justify-between pt-2 mt-2 border-t text-xs">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSelectToday}
            className="h-8 px-2 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10"
          >
            <Check className="h-3.5 w-3.5 mr-1" /> Today
          </Button>

          {showClear && dateValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearDate}
              className="h-8 px-2 text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="h-3.5 w-3.5 mr-1" /> Clear Date
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
