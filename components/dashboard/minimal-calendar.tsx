"use client"

import { CalendarDay, DayStatus } from '@/types/calendar'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface MinimalCalendarProps {
  startDate: Date
  currentDay: number
  days: CalendarDay[]
}

export function MinimalCalendar({ startDate, currentDay, days }: MinimalCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)

  const getStatusColor = (day: CalendarDay, isToday: boolean) => {
    if (isToday) {
      return day.status === DayStatus.COMPLETE 
        ? "bg-primary text-primary-foreground ring-2 ring-primary/50 ring-offset-2"
        : "bg-background border-2 border-primary text-primary ring-2 ring-primary/30 ring-offset-2"
    }
    
    switch (day.status) {
      case DayStatus.COMPLETE:
        return "bg-green-500 text-white shadow-lg shadow-green-500/30"
      case DayStatus.PARTIAL:
        return "bg-yellow-500 text-white shadow-lg shadow-yellow-500/30"
      case DayStatus.INCOMPLETE:
        return "bg-red-100 text-red-700 border border-red-200"
      case DayStatus.FUTURE:
        return "bg-background border border-border text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      {/* Calendar grid - responsive with CSS grid */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="p-4">
          <div className="grid gap-2 grid-cols-7 md:grid-cols-15">
            {Array.from({ length: 75 }).map((_, index) => {
              const dayNumber = index + 1
              const day = days.find(d => d.dayNumber === dayNumber)
              
              if (!day) {
                return <div key={index} className="aspect-square" />
              }

              const isToday = day.dayNumber === currentDay
              const isFuture = day.status === DayStatus.FUTURE
              const isHovered = hoveredDay === dayNumber
              
              return (
                <motion.div
                  key={index}
                  className={cn(
                    "relative aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-200 cursor-pointer",
                    "hover:scale-110 hover:z-10",
                    getStatusColor(day, isToday),
                    isHovered && "scale-110 z-10",
                    isFuture && "cursor-not-allowed"
                  )}
                  whileHover={{ scale: isFuture ? 1 : 1.1 }}
                  whileTap={{ scale: isFuture ? 1 : 0.95 }}
                  onMouseEnter={() => setHoveredDay(dayNumber)}
                  onMouseLeave={() => setHoveredDay(null)}
                  title={`Day ${dayNumber}${
                    day.status === DayStatus.COMPLETE ? ' - Complete' : 
                    day.status === DayStatus.PARTIAL ? ` - ${day.tasksCompleted}/${day.totalTasks || 6} tasks` : 
                    day.status === DayStatus.FUTURE ? ' - Future' : 
                    ' - Missed'
                  }`}
                >
                  <span className="relative z-10">{dayNumber}</span>
                  
                  {/* Completion indicator */}
                  {day.status === DayStatus.PARTIAL && (
                    <div className="absolute inset-0 rounded-lg overflow-hidden">
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-green-500/30 transition-all duration-300"
                        style={{ height: `${((day.tasksCompleted || 0) / (day.totalTasks || 6)) * 100}%` }}
                      />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Enhanced Progress Summary */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div 
          className="text-center p-4 rounded-lg bg-primary/5 border border-primary/10"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <div className="text-2xl font-bold text-primary mb-1">
            {days.filter(d => d.status === DayStatus.COMPLETE).length}
          </div>
          <div className="text-xs text-muted-foreground">
            Days Complete
          </div>
        </motion.div>
        
        <motion.div 
          className="text-center p-4 rounded-lg bg-primary/5 border border-primary/10"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <div className="text-2xl font-bold text-primary mb-1">
            {Math.round((days.filter(d => d.status === DayStatus.COMPLETE).length / 75) * 100)}%
          </div>
          <div className="text-xs text-muted-foreground">
            Progress
          </div>
        </motion.div>
        
        <motion.div 
          className="text-center p-4 rounded-lg bg-primary/5 border border-primary/10"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <div className="text-2xl font-bold text-primary mb-1">
            {Math.max(0, 75 - currentDay + 1)}
          </div>
          <div className="text-xs text-muted-foreground">
            Days Left
          </div>
        </motion.div>
      </div>

      {/* Weekly breakdown for mobile */}
      <div className="border-t pt-4 block md:hidden">
        <h4 className="text-sm font-medium mb-3">Weekly Progress</h4>
        <div className="space-y-2">
          {Array.from({ length: Math.ceil(75 / 7) }).map((_, weekIndex) => {
            const weekStart = weekIndex * 7 + 1
            const weekEnd = Math.min(weekStart + 6, 75)
            const weekDays = days.filter(d => d.dayNumber >= weekStart && d.dayNumber <= weekEnd)
            const completedInWeek = weekDays.filter(d => d.status === DayStatus.COMPLETE).length
            
            return (
              <div key={weekIndex} className="flex items-center gap-3">
                <div className="text-xs text-muted-foreground w-16">
                  Week {weekIndex + 1}
                </div>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(completedInWeek / weekDays.length) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {completedInWeek}/{weekDays.length}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}