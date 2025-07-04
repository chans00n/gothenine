"use client"

import { useState } from "react"
import { CalendarGrid } from "@/components/calendar/calendar-grid"
import { generate75DayCalendar, getCurrentDayNumber } from "@/lib/calendar-utils"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"
import { CalendarDay } from "@/types/calendar"
import { subDays } from "date-fns"

export default function CalendarDemoPage() {
  // Start date 10 days ago for demo purposes
  const startDate = subDays(new Date(), 10)
  const currentDay = getCurrentDayNumber(startDate)

  // Mock progress data
  const mockProgressData: { [key: number]: { completed: boolean; tasksCompleted: number; totalTasks: number } } = {
    1: { completed: true, tasksCompleted: 6, totalTasks: 6 },
    2: { completed: true, tasksCompleted: 6, totalTasks: 6 },
    3: { completed: false, tasksCompleted: 4, totalTasks: 6 },
    4: { completed: true, tasksCompleted: 6, totalTasks: 6 },
    5: { completed: true, tasksCompleted: 6, totalTasks: 6 },
    6: { completed: false, tasksCompleted: 0, totalTasks: 6 },
    7: { completed: true, tasksCompleted: 6, totalTasks: 6 },
    8: { completed: false, tasksCompleted: 3, totalTasks: 6 },
    9: { completed: true, tasksCompleted: 6, totalTasks: 6 },
    10: { completed: true, tasksCompleted: 6, totalTasks: 6 },
  }

  const [calendarDays] = useState(() => 
    generate75DayCalendar(startDate, mockProgressData)
  )

  const handleDayClick = (day: CalendarDay) => {
    toast.info(
      `Day ${day.dayNumber} clicked`,
      `Date: ${day.date.toLocaleDateString()}, Status: ${day.status}`
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">75 Day Calendar Demo</h1>
            <p className="text-muted-foreground">
              Visual calendar component for tracking 75 Hard progress
            </p>
          </div>
          <Button
            onClick={() => window.location.href = '/dashboard'}
            variant="outline"
          >
            Back to Dashboard
          </Button>
        </div>

        <CalendarGrid
          startDate={startDate}
          currentDay={currentDay}
          days={calendarDays}
          onDayClick={handleDayClick}
          isLoading={false}
        />

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 rounded-lg border bg-muted/50">
            <h3 className="font-semibold mb-2">Calendar Features:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>✓ 75-day grid layout with month separations</li>
              <li>✓ Individual day components with status indicators</li>
              <li>✓ Day status: Complete, Partial, Incomplete, Future</li>
              <li>✓ Progress bars for partial completion days</li>
              <li>✓ Current day highlighting with pulsing animation</li>
              <li>✓ Month navigation with smooth transitions</li>
              <li>✓ Statistics overview (completed, partial, missed)</li>
              <li>✓ Responsive: Grid on desktop, list on mobile</li>
              <li>✓ Click interaction for day details</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg border bg-muted/50">
            <h3 className="font-semibold mb-2">Status Legend:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500" />
                <span>Complete - All 6 tasks finished</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500" />
                <span>Partial - Some tasks completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500" />
                <span>Incomplete - No tasks completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500" />
                <span>Today - Current day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-500" />
                <span>Future - Upcoming days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}