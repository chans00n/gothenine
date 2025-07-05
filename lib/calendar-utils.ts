import { DayStatus, CalendarDay } from "@/types/calendar"
import { addDays, isToday, isBefore, isAfter } from "date-fns"
import { getTodayInTimezone, isToday as isTodayInTimezone } from "@/lib/utils/timezone"

export function generate75DayCalendar(
  startDate: Date,
  progressData?: {
    [dayNumber: number]: {
      completed: boolean
      tasksCompleted: number
      totalTasks: number
    }
  },
  timezone: string = 'America/New_York'
): CalendarDay[] {
  const calendar: CalendarDay[] = []
  const today = getTodayInTimezone(timezone)
  
  // Normalize startDate to midnight
  const normalizedStart = new Date(startDate)
  normalizedStart.setHours(0, 0, 0, 0)

  for (let i = 0; i < 75; i++) {
    const dayNumber = i + 1
    const date = addDays(normalizedStart, i)
    date.setHours(0, 0, 0, 0)
    
    let status: DayStatus
    const dayData = progressData?.[dayNumber]

    if (isAfter(date, today)) {
      status = DayStatus.FUTURE
    } else if (dayData) {
      if (dayData.completed) {
        status = DayStatus.COMPLETE
      } else if (dayData.tasksCompleted > 0) {
        status = DayStatus.PARTIAL
      } else {
        status = DayStatus.INCOMPLETE
      }
    } else if (isTodayInTimezone(date, timezone)) {
      status = DayStatus.TODAY
    } else {
      // Past day with no data
      status = DayStatus.SKIPPED
    }

    calendar.push({
      dayNumber,
      date,
      status,
      tasksCompleted: dayData?.tasksCompleted || 0,
      totalTasks: dayData?.totalTasks || 6,
    })
  }

  return calendar
}

export function getCurrentDayNumber(startDate: Date, timezone: string = 'America/New_York'): number {
  const today = getTodayInTimezone(timezone)
  
  // Normalize start date to midnight
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)

  if (isBefore(today, start)) {
    return 0
  }

  const diffTime = Math.abs(today.getTime() - start.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.min(diffDays + 1, 75)
}

export function getCalendarStats(days: CalendarDay[]) {
  return {
    totalDays: days.length,
    completedDays: days.filter(d => d.status === DayStatus.COMPLETE).length,
    partialDays: days.filter(d => d.status === DayStatus.PARTIAL).length,
    incompleteDays: days.filter(d => d.status === DayStatus.INCOMPLETE).length,
    skippedDays: days.filter(d => d.status === DayStatus.SKIPPED).length,
    futureDays: days.filter(d => d.status === DayStatus.FUTURE).length,
    currentStreak: calculateCurrentStreak(days),
    longestStreak: calculateLongestStreak(days),
    completionPercentage: calculateCompletionPercentage(days)
  }
}

function calculateCurrentStreak(days: CalendarDay[]): number {
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Start from today or the last completed day
  for (let i = days.length - 1; i >= 0; i--) {
    const day = days[i]
    
    // Skip future days
    if (day.status === DayStatus.FUTURE) continue
    
    // If we hit an incomplete day, streak is broken
    if (day.status !== DayStatus.COMPLETE) break
    
    streak++
  }

  return streak
}

function calculateLongestStreak(days: CalendarDay[]): number {
  let currentStreak = 0
  let longestStreak = 0

  for (const day of days) {
    if (day.status === DayStatus.COMPLETE) {
      currentStreak++
      longestStreak = Math.max(longestStreak, currentStreak)
    } else if (day.status !== DayStatus.FUTURE) {
      currentStreak = 0
    }
  }

  return longestStreak
}

function calculateCompletionPercentage(days: CalendarDay[]): number {
  const completedDays = days.filter(d => d.status === DayStatus.COMPLETE).length
  const totalPastDays = days.filter(d => 
    d.status !== DayStatus.FUTURE
  ).length

  if (totalPastDays === 0) return 0
  
  return Math.round((completedDays / totalPastDays) * 100)
}