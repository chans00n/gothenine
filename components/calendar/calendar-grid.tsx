"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDay, CalendarDaySkeleton } from "./calendar-day"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  TrendingUp,
  Target,
  Award
} from "lucide-react"
import { DayStatus, CalendarDay as CalendarDayType } from "@/types/calendar"
import { cn } from "@/lib/utils"

interface CalendarGridProps {
  startDate: Date
  currentDay: number
  days: CalendarDayType[]
  onDayClick?: (day: CalendarDayType) => void
  isLoading?: boolean
}

export function CalendarGrid({
  startDate,
  currentDay,
  days,
  onDayClick,
  isLoading
}: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(0)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  // Calculate calendar data
  const calendarData = useMemo(() => {
    const months: { name: string; year: number; days: CalendarDayType[] }[] = []
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                       "July", "August", "September", "October", "November", "December"]
    
    // Group days by month
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

  // Calculate stats
  const stats = useMemo(() => {
    const completed = days.filter(d => d.status === DayStatus.COMPLETE).length
    const partial = days.filter(d => d.status === DayStatus.PARTIAL).length
    const incomplete = days.filter(d => d.status === DayStatus.INCOMPLETE).length
    const remaining = days.filter(d => d.status === DayStatus.FUTURE).length
    
    return { completed, partial, incomplete, remaining }
  }, [days])

  const handleDayClick = (day: CalendarDayType) => {
    setSelectedDay(day.dayNumber)
    onDayClick?.(day)
  }

  const navigateMonth = (direction: number) => {
    const newMonth = currentMonth + direction
    if (newMonth >= 0 && newMonth < calendarData.length) {
      setCurrentMonth(newMonth)
    }
  }

  const navigateToToday = () => {
    // Find which month contains today
    const todayIndex = days.findIndex(d => d.status === DayStatus.TODAY)
    if (todayIndex === -1) return

    const todayDay = days[todayIndex]
    
    // Find which month this day belongs to
    for (let i = 0; i < calendarData.length; i++) {
      const month = calendarData[i]
      if (month.days.some(d => d.dayNumber === todayDay.dayNumber)) {
        setCurrentMonth(i)
        setSelectedDay(todayDay.dayNumber)
        break
      }
    }
  }

  // Get the first day of the month to calculate offset
  const firstDayOfMonth = currentMonthData.days[0]?.date
  const startOffset = firstDayOfMonth ? firstDayOfMonth.getDay() : 0

  if (isLoading) {
    return <CalendarGridSkeleton />
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Calendar View</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Day {currentDay} of 75</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth(-1)}
              disabled={currentMonth === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={navigateToToday}
              className="gap-1"
            >
              <Calendar className="h-4 w-4" />
              Today
            </Button>
          </div>
          
          <h3 className="text-lg font-semibold">{currentMonthData.name}</h3>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth(1)}
            disabled={currentMonth === calendarData.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {/* Day Labels */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
            <div
              key={`day-${index}`}
              className="text-center text-xs md:text-sm font-medium text-muted-foreground p-2"
            >
              {day}
            </div>
          ))}

          {/* Empty cells for offset */}
          {Array.from({ length: startOffset }).map((_, index) => (
            <div key={`empty-${index}`} />
          ))}

          {/* Calendar Days */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMonth}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="contents"
            >
              {currentMonthData.days.map((day) => (
                day.hidden ? (
                  <div key={day.dayNumber} className="opacity-20 pointer-events-none">
                    <CalendarDay
                      dayNumber={day.dayNumber}
                      date={day.date}
                      status={day.status}
                      tasksCompleted={day.tasksCompleted}
                      totalTasks={day.totalTasks}
                      isCurrentDay={day.dayNumber === currentDay}
                      isSelected={selectedDay === day.dayNumber}
                    />
                  </div>
                ) : (
                  <CalendarDay
                    key={day.dayNumber}
                    dayNumber={day.dayNumber}
                    date={day.date}
                    status={day.status}
                    tasksCompleted={day.tasksCompleted}
                    totalTasks={day.totalTasks}
                    isCurrentDay={day.dayNumber === currentDay}
                    isSelected={selectedDay === day.dayNumber}
                    onClick={() => handleDayClick(day)}
                  />
                )
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}

function getStatusIcon(status: DayStatus) {
  switch (status) {
    case DayStatus.COMPLETE:
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    case DayStatus.INCOMPLETE:
      return <XCircle className="h-5 w-5 text-red-500" />
    case DayStatus.PARTIAL:
      return <AlertCircle className="h-5 w-5 text-yellow-500" />
    case DayStatus.SKIPPED:
      return <MinusCircle className="h-5 w-5 text-gray-500" />
    case DayStatus.TODAY:
    case DayStatus.FUTURE:
    default:
      return <Circle className="h-5 w-5 text-muted-foreground" />
  }
}

function CalendarGridSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <CalendarDaySkeleton key={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Add missing imports at the top
import { CheckCircle2, XCircle, AlertCircle, MinusCircle, Circle } from "lucide-react"