'use client'

import { useState } from 'react'
import { CalendarDay, DayStatus } from '@/types/calendar'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { EditableDayModal } from './editable-day-modal'

interface CalendarWithDetailsProps {
  startDate: Date
  currentDay: number
  days: CalendarDay[]
  challengeId: string
  timezone: string
}

export function CalendarWithDetails({ 
  startDate, 
  currentDay, 
  days, 
  challengeId,
  timezone 
}: CalendarWithDetailsProps) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const handleDayClick = (day: CalendarDay) => {
    // Don't allow clicking on future days
    if (day.status === DayStatus.FUTURE) return
    
    console.log('Calendar: Clicked on day', day.dayNumber, 'with date', day.date)
    setSelectedDay(day)
    setIsModalOpen(true)
  }

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!selectedDay) return
    
    const currentIndex = days.findIndex(d => d.dayNumber === selectedDay.dayNumber)
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    
    // Wrap around if needed
    if (newIndex < 0) newIndex = days.length - 1
    if (newIndex >= days.length) newIndex = 0
    
    // Skip future days when navigating
    while (days[newIndex]?.status === DayStatus.FUTURE) {
      if (direction === 'next') {
        newIndex++
        if (newIndex >= days.length) break
      } else {
        newIndex--
        if (newIndex < 0) break
      }
    }
    
    if (newIndex >= 0 && newIndex < days.length && days[newIndex]?.status !== DayStatus.FUTURE) {
      setSelectedDay(days[newIndex])
    }
  }

  const handleDayUpdate = () => {
    // This will be called when a day is updated in the modal
    // The parent component should refetch data
    window.location.reload() // Simple refresh for now
  }

  return (
    <>
      <div className="space-y-6">
        {/* Calendar grid - responsive with CSS grid */}
        <div className="overflow-hidden rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm">
          <div className="p-6">
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
                      "relative aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-200",
                      !isFuture && "cursor-pointer hover:scale-110 hover:z-10",
                      getStatusColor(day, isToday),
                      isHovered && !isFuture && "scale-110 z-10",
                      isFuture && "cursor-not-allowed opacity-50"
                    )}
                    whileHover={{ scale: isFuture ? 1 : 1.1 }}
                    whileTap={{ scale: isFuture ? 1 : 0.95 }}
                    onMouseEnter={() => !isFuture && setHoveredDay(dayNumber)}
                    onMouseLeave={() => setHoveredDay(null)}
                    onClick={() => handleDayClick(day)}
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

        {/* Mobile hint */}
        <div className="text-center text-sm text-muted-foreground md:hidden">
          Tap any past day to view and edit tasks
        </div>
      </div>

      {/* Day Detail Modal */}
      <EditableDayModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedDay(null)
        }}
        day={selectedDay}
        challengeId={challengeId}
        timezone={timezone}
        onNavigate={handleNavigate}
        onUpdate={handleDayUpdate}
      />
    </>
  )
}