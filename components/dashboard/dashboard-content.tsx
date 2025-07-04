"use client"

import { useState } from 'react'
import { CalendarGrid } from '@/components/calendar/calendar-grid'
import { DayDetailModal } from '@/components/calendar/day-detail-modal'
import { CalendarDay as CalendarDayType, DayStatus } from '@/types/calendar'

interface DashboardContentProps {
  calendarData: {
    startDate: Date
    currentDay: number
    days: CalendarDayType[]
  }
}

export function DashboardContent({ 
  calendarData 
}: DashboardContentProps) {
  const [selectedDay, setSelectedDay] = useState<CalendarDayType | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleDayClick = (day: CalendarDayType) => {
    // Only allow clicking on past days, today, or completed days
    if (day.status !== DayStatus.FUTURE) {
      setSelectedDay(day)
      setIsModalOpen(true)
    }
  }

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!selectedDay) return
    
    const currentIndex = calendarData.days.findIndex(d => d.dayNumber === selectedDay.dayNumber)
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1
    
    if (newIndex >= 0 && newIndex < calendarData.days.length) {
      const newDay = calendarData.days[newIndex]
      if (newDay.status !== DayStatus.FUTURE) {
        setSelectedDay(newDay)
      }
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-4">Your Journey</h2>
      <CalendarGrid
        startDate={calendarData.startDate}
        currentDay={calendarData.currentDay}
        days={calendarData.days}
        onDayClick={handleDayClick}
        isLoading={false}
      />
      
      <DayDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedDay(null)
        }}
        day={selectedDay}
        onNavigate={handleNavigate}
      />
    </div>
  )
}