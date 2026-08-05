"use client"

import * as React from "react"
import { format, parseISO, isValid, setYear, setMonth } from "date-fns"
import { Calendar as CalendarIcon, Grid, CalendarDays, X, Check, Edit3 } from "lucide-react"

import { cn } from "@/lib/utils/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
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
  const [showDirectInput, setShowDirectInput] = React.useState(false)
  const [manualInputValue, setManualInputValue] = React.useState("")
  const [selectedDecade, setSelectedDecade] = React.useState<number | null>(null)
  
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
      setManualInputValue(format(dateValue, "yyyy-MM-dd"))
    }
  }

  // Detect Mobile Viewports (< 640px)
  const [isMobile, setIsMobile] = React.useState(false)
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

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

  // Handle Year Change
  const handleYearChange = (newYear: number) => {
    triggerHaptic()
    const newDate = setYear(currentMonth, newYear)
    setCurrentMonth(newDate)
    setShowYearGrid(false)
  }

  // Handle Month Change
  const handleMonthChange = (newMonthIndex: number) => {
    triggerHaptic()
    const newDate = setMonth(currentMonth, newMonthIndex)
    setCurrentMonth(newDate)
  }

  const currentYear = currentMonth.getFullYear()

  // Generate Years list
  const yearsList = React.useMemo(() => {
    const years: number[] = []
    for (let y = maxYear; y >= minYear; y--) {
      years.push(y)
    }
    return years
  }, [minYear, maxYear])

  // Generate Decade List for Quick Jump Bar (e.g. 2020s, 2010s, 2000s, 1990s, 1980s, 1970s, 1960s, 1950s)
  const decadesList = React.useMemo(() => {
    const currentDecade = Math.floor(new Date().getFullYear() / 10) * 10
    const list: number[] = []
    for (let d = currentDecade; d >= 1930; d -= 10) {
      if (d <= maxYear && d + 9 >= minYear) {
        list.push(d)
      }
    }
    return list
  }, [minYear, maxYear])

  const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  // Auto-scroll year grid to active year or selected decade
  React.useEffect(() => {
    if (showYearGrid && yearGridRef.current) {
      const targetYear = selectedDecade ? selectedDecade + 9 : currentYear
      const activeEl = yearGridRef.current.querySelector(`[data-year="${targetYear}"]`) ||
                       yearGridRef.current.querySelector('[data-selected="true"]')
      if (activeEl) {
        activeEl.scrollIntoView({ block: "center", behavior: "smooth" })
      }
    }
  }, [showYearGrid, currentYear, selectedDecade])

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

  const handleManualInputSubmit = () => {
    if (!manualInputValue) return
    const parsed = parseISO(manualInputValue)
    if (isValid(parsed)) {
      triggerHaptic()
      setCurrentMonth(parsed)
      if (onChange) onChange(format(parsed, "yyyy-MM-dd"))
      setOpen(false)
      setShowDirectInput(false)
    }
  }

  // Content Component rendered inside Popover or Mobile Modal
  const DatePickerContent = (
    <div className="w-full space-y-3">
      {/* Header Bar with Year & Month selectors */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Year Selector Dropdown */}
          <select
            aria-label="Select Year"
            value={currentYear}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="h-10 rounded-lg border border-input bg-muted/80 hover:bg-muted px-2.5 py-1 text-xs sm:text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-colors shrink-0"
          >
            {yearsList.map((y) => (
              <option key={y} value={y} className="bg-popover text-popover-foreground">
                {y}
              </option>
            ))}
          </select>

          {/* Month Selector Dropdown */}
          <select
            aria-label="Select Month"
            value={currentMonth.getMonth()}
            onChange={(e) => handleMonthChange(Number(e.target.value))}
            className="h-10 rounded-lg border border-input bg-muted/80 hover:bg-muted px-2.5 py-1 text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-colors flex-1 min-w-0 truncate"
          >
            {monthsList.map((m, idx) => (
              <option key={m} value={idx} className="bg-popover text-popover-foreground">
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* View Toggles: Year Grid & Direct Input */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant={showYearGrid ? "default" : "outline"}
            size="sm"
            aria-label={showYearGrid ? "Switch to Calendar view" : "Switch to Year Grid view"}
            onClick={() => {
              setShowYearGrid(!showYearGrid)
              setShowDirectInput(false)
            }}
            className="h-10 px-2.5 text-xs font-semibold gap-1 shrink-0"
          >
            {showYearGrid ? <CalendarDays className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            <span>{showYearGrid ? "Calendar" : "Years"}</span>
          </Button>

          <Button
            type="button"
            variant={showDirectInput ? "default" : "ghost"}
            size="icon"
            aria-label="Direct Type Date"
            onClick={() => {
              setShowDirectInput(!showDirectInput)
              setShowYearGrid(false)
            }}
            className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Direct Input Mode */}
      {showDirectInput ? (
        <div className="p-3 rounded-xl border bg-muted/30 space-y-3 animate-in fade-in duration-200">
          <p className="text-xs font-medium text-muted-foreground">Type date (YYYY-MM-DD):</p>
          <div className="flex gap-2">
            <Input
              type="date"
              value={manualInputValue}
              onChange={(e) => setManualInputValue(e.target.value)}
              className="h-11 bg-background text-sm font-medium"
            />
            <Button type="button" onClick={handleManualInputSubmit} className="h-11 px-4 font-semibold">
              Apply
            </Button>
          </div>
        </div>
      ) : showYearGrid ? (
        /* View 1: Touch & Decadal Year Grid View */
        <div className="space-y-2 animate-in fade-in duration-200">
          {/* Decadal Jump Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 touch-pan-x">
            {decadesList.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDecade(d)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-semibold shrink-0 border transition-all",
                  selectedDecade === d
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {d}s
              </button>
            ))}
          </div>

          <div
            ref={yearGridRef}
            className="grid grid-cols-4 gap-1.5 max-h-[220px] overflow-y-auto p-1 touch-contain scroll-smooth"
          >
            {yearsList.map((y) => (
              <button
                key={y}
                type="button"
                data-year={y}
                data-selected={y === currentYear}
                onClick={() => handleYearChange(y)}
                className={cn(
                  "h-11 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center border select-none active:scale-95",
                  y === currentYear
                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm"
                    : "hover:bg-accent border-transparent text-foreground"
                )}
              >
                {y}
              </button>
            ))}
          </div>
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
          className="p-0 border-0"
        />
      )}

      {/* Footer Shortcuts: Today & Clear & Close */}
      <div className="flex items-center justify-between pt-2.5 border-t text-xs">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSelectToday}
          className="h-8 px-2.5 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10"
        >
          <Check className="h-3.5 w-3.5 mr-1" /> Today
        </Button>

        <div className="flex items-center gap-1">
          {showClear && dateValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearDate}
              className="h-8 px-2 text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          )}
          {isMobile && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 px-3 text-xs font-semibold"
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <Button
        type="button"
        variant="outline"
        aria-label={dateValue ? `Selected date: ${format(dateValue, "MMMM d, yyyy")}` : placeholder}
        className={cn(
          "w-full justify-start text-left font-normal bg-transparent text-base md:text-sm h-11 md:h-10 px-3 transition-colors",
          !dateValue && "text-muted-foreground",
          className
        )}
        disabled={disabled}
        onClick={() => {
          triggerHaptic()
          setOpen(true)
        }}
      >
        <CalendarIcon className="mr-2 h-4 w-4 opacity-50 shrink-0" />
        <span className="truncate">
          {dateValue ? format(dateValue, "MMMM d, yyyy") : placeholder}
        </span>
      </Button>

      {/* RENDER MODE A: Mobile Responsive Centered Modal Dialog (< 640px) */}
      {isMobile ? (
        open && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full max-w-[340px] p-4 rounded-2xl border bg-popover text-popover-foreground shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {DatePickerContent}
            </div>
          </div>
        )
      ) : (
        /* RENDER MODE B: Desktop / Laptop Collision-Aware Popover (≥ 640px) */
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <span className="hidden" />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="bottom"
            sideOffset={8}
            className="w-[340px] p-4 z-[60] shadow-xl rounded-2xl border bg-popover text-popover-foreground max-h-[calc(100vh-2rem)] overflow-y-auto"
          >
            {DatePickerContent}
          </PopoverContent>
        </Popover>
      )}
    </>
  )
}
