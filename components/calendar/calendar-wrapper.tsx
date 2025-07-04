"use client"

import { useState, useMemo, useEffect } from 'react'
import { CalendarGrid } from '@/components/calendar/calendar-grid'
import { CalendarGridMobile } from '@/components/calendar/calendar-grid-mobile'
import { DayDetailModal } from '@/components/calendar/day-detail-modal'
import { CalendarFilter } from '@/components/calendar/calendar-filter'
import { CalendarDay, DayStatus } from '@/types/calendar'

interface CalendarWrapperProps {
  startDate: Date
  currentDay: number
  days: CalendarDay[]
}

export function CalendarWrapper({ startDate, currentDay, days }: CalendarWrapperProps) {
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<DayStatus[]>([])
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Filter days based on active filters
  const filteredDays = useMemo(() => {
    if (activeFilters.length === 0) return days
    
    return days.map(day => {
      // Don't filter out TODAY or FUTURE days
      if (day.status === DayStatus.TODAY || day.status === DayStatus.FUTURE) {
        return day
      }
      
      // Hide days that don't match the active filters
      if (!activeFilters.includes(day.status)) {
        return { ...day, hidden: true }
      }
      
      return day
    })
  }, [days, activeFilters])

  const handleDayClick = (day: CalendarDay) => {
    // Only allow clicking on past days, today, or completed days
    if (day.status !== DayStatus.FUTURE) {
      setSelectedDay(day)
      setIsModalOpen(true)
    }
  }

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!selectedDay) return
    
    const currentIndex = days.findIndex(d => d.dayNumber === selectedDay.dayNumber)
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1
    
    if (newIndex >= 0 && newIndex < days.length) {
      const newDay = days[newIndex]
      if (newDay.status !== DayStatus.FUTURE) {
        setSelectedDay(newDay)
      }
    }
  }

  return (
    <div className="space-y-4 w-full overflow-hidden">
      {/* Show filter only on desktop */}
      <div className="hidden md:block">
        <CalendarFilter 
          activeFilters={activeFilters}
          onFilterChange={setActiveFilters}
        />
      </div>
      
      {/* Use mobile grid on small screens */}
      {isMobile ? (
        <CalendarGridMobile
          startDate={startDate}
          currentDay={currentDay}
          days={filteredDays}
          onDayClick={handleDayClick}
          isLoading={false}
        />
      ) : (
        <CalendarGrid
          startDate={startDate}
          currentDay={currentDay}
          days={filteredDays}
          onDayClick={handleDayClick}
          isLoading={false}
        />
      )}
      
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