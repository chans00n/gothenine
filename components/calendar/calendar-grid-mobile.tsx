"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDay } from "./calendar-day-mobile"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { DayStatus, CalendarDay as CalendarDayType } from "@/types/calendar"
import { cn } from "@/lib/utils"

interface CalendarGridMobileProps {
  startDate: Date
  currentDay: number
  days: CalendarDayType[]
  onDayClick?: (day: CalendarDayType) => void
  isLoading?: boolean
}

export function CalendarGridMobile({
  startDate,
  currentDay,
  days,
  onDayClick,
  isLoading
}: CalendarGridMobileProps) {
  const [currentMonth, setCurrentMonth] = useState(0)

  // Calculate calendar data
  const calendarData = useMemo(() => {
    const months: { name: string; year: number; days: CalendarDayType[] }[] = []
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                       "July", "August", "September", "October", "November", "December"]
    
    let currentMonthData: { name: string; year: number; days: CalendarDayType[] } | null = null
    
    days.forEach((day) => {
      const monthName = monthNames[day.date.getMonth()]
      const year = day.date.getFullYear()
      const monthKey = `${monthName} ${year}`
      
      if (!currentMonthData || currentMonthData.name !== monthKey) {
        if (currentMonthData) {
          months.push(currentMonthData)
        }
        currentMonthData = {
          name: monthKey,
          year: year,
          days: []
        }
      }
      
      currentMonthData.days.push(day)
    })
    
    if (currentMonthData) {
      months.push(currentMonthData)
    }
    
    return months
  }, [days])

  const currentMonthData = calendarData[currentMonth] || { name: "", year: 0, days: [] }

  const navigateMonth = (direction: number) => {
    const newMonth = currentMonth + direction
    if (newMonth >= 0 && newMonth < calendarData.length) {
      setCurrentMonth(newMonth)
    }
  }

  const navigateToToday = () => {
    const todayIndex = days.findIndex(d => d.status === DayStatus.TODAY)
    if (todayIndex === -1) return

    const todayDay = days[todayIndex]
    
    for (let i = 0; i < calendarData.length; i++) {
      const month = calendarData[i]
      if (month.days.some(d => d.dayNumber === todayDay.dayNumber)) {
        setCurrentMonth(i)
        break
      }
    }
  }

  const firstDayOfMonth = currentMonthData.days[0]?.date
  const startOffset = firstDayOfMonth ? firstDayOfMonth.getDay() : 0

  if (isLoading) {
    return (
      <Card>
        <CardContent className="h-[400px] animate-pulse bg-muted" />
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden w-full">
      <CardContent className="p-0 w-full">
        {/* Simplified Month Navigation */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth(-1)}
            disabled={currentMonth === 0}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold">
              {currentMonthData.name}
            </h3>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth(1)}
            disabled={currentMonth === calendarData.length - 1}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Today Button */}
        <div className="px-4 md:px-6 py-3 border-b">
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToToday}
            className="w-full gap-2"
          >
            <Calendar className="h-4 w-4" />
            Go to Today
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="p-4 md:p-6 max-w-full">
          {/* Day Labels */}
          <div className="grid grid-cols-7 gap-1 mb-2 w-full">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
              <div
                key={`day-label-${index}`}
                className="text-center text-[10px] font-medium text-muted-foreground flex items-center justify-center"
              >
                {day.substring(0, 1)}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMonth}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-7 gap-1"
            >
              {/* Empty cells for offset */}
              {Array.from({ length: startOffset }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}

              {/* Calendar Days */}
              {currentMonthData.days.map((day) => (
                <CalendarDay
                  key={day.dayNumber}
                  dayNumber={day.dayNumber}
                  date={day.date}
                  status={day.status}
                  tasksCompleted={day.tasksCompleted}
                  totalTasks={day.totalTasks}
                  isCurrentDay={day.dayNumber === currentDay}
                  onClick={() => onDayClick?.(day)}
                  hidden={day.hidden}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Simplified Quick View */}
        <div className="border-t px-4 md:px-6 py-4 pb-20">
          <h4 className="text-sm font-medium mb-3 px-2">Quick View</h4>
          <div className="space-y-2 max-h-[150px] overflow-y-auto overflow-x-hidden px-2 pb-2">
            {currentMonthData.days
              .filter(day => day.status !== DayStatus.FUTURE)
              .map((day) => (
                <button
                  key={day.dayNumber}
                  onClick={() => onDayClick?.(day)}
                  className={cn(
                    "w-full p-3 rounded-lg flex items-center justify-between",
                    "transition-colors",
                    day.status === DayStatus.COMPLETE && "bg-green-50 dark:bg-green-950/20",
                    day.status === DayStatus.PARTIAL && "bg-yellow-50 dark:bg-yellow-950/20",
                    day.status === DayStatus.INCOMPLETE && "bg-red-50 dark:bg-red-950/20",
                    day.status === DayStatus.TODAY && "bg-blue-50 dark:bg-blue-950/20 ring-2 ring-blue-500",
                    day.status === DayStatus.SKIPPED && "bg-gray-50 dark:bg-gray-950/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <div className="font-medium text-sm">Day {day.dayNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {day.status === DayStatus.PARTIAL && (
                      <span className="text-xs font-medium">
                        {day.tasksCompleted}/{day.totalTasks}
                      </span>
                    )}
                    <div className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      day.status === DayStatus.COMPLETE && "bg-green-500",
                      day.status === DayStatus.PARTIAL && "bg-yellow-500",
                      day.status === DayStatus.INCOMPLETE && "bg-red-500",
                      day.status === DayStatus.TODAY && "bg-blue-500",
                      day.status === DayStatus.SKIPPED && "bg-gray-400"
                    )} />
                  </div>
                </button>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}