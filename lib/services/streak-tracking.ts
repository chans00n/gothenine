import { createClient } from '@/lib/supabase/server'
import { DayStatus } from '@/types/calendar'
import { startOfDay, endOfDay, subDays, addDays, differenceInDays } from 'date-fns'
import { getTodayInTimezone, formatDateForDB } from '@/lib/utils/timezone'

export interface StreakData {
  currentStreak: number
  longestStreak: number
  streakStartDate: Date | null
  streakEndDate: Date | null
  totalCompletedDays: number
  completionRate: number
  isActiveStreak: boolean
  lastCompletedDate: Date | null
}

export interface StreakHistory {
  startDate: Date
  endDate: Date
  length: number
  isActive: boolean
}

export class StreakTrackingService {
  private static instance: StreakTrackingService

  static getInstance(): StreakTrackingService {
    if (!StreakTrackingService.instance) {
      StreakTrackingService.instance = new StreakTrackingService()
    }
    return StreakTrackingService.instance
  }

  async getStreakData(challengeId: string, timezone: string = 'America/New_York'): Promise<StreakData> {
    const supabase = await createClient()
    
    // Get all daily progress records
    const { data: progressRecords, error } = await supabase
      .from('daily_progress')
      .select('date, is_complete, tasks_completed')
      .eq('challenge_id', challengeId)
      .order('date', { ascending: true })

    if (error || !progressRecords || progressRecords.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        streakStartDate: null,
        streakEndDate: null,
        totalCompletedDays: 0,
        completionRate: 0,
        isActiveStreak: false,
        lastCompletedDate: null
      }
    }

    const today = getTodayInTimezone(timezone)
    const todayStr = formatDateForDB(today)
    
    // Calculate streaks
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    let streakStartDate: Date | null = null
    let currentStreakStart: Date | null = null
    let lastCompletedDate: Date | null = null
    let totalCompletedDays = 0

    // Sort records by date
    const sortedRecords = progressRecords.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Process each day to find streaks
    for (let i = 0; i < sortedRecords.length; i++) {
      const record = sortedRecords[i]
      const recordDate = new Date(record.date)
      
      if (record.is_complete) {
        totalCompletedDays++
        lastCompletedDate = recordDate

        if (tempStreak === 0) {
          // Start of a new streak
          streakStartDate = recordDate
        }
        
        tempStreak++
        
        // Check if this is part of the current streak
        if (i === sortedRecords.length - 1 || record.date === todayStr) {
          // This is the most recent day
          currentStreak = tempStreak
          currentStreakStart = streakStartDate
        } else if (i < sortedRecords.length - 1) {
          // Check if next day breaks the streak
          const nextRecord = sortedRecords[i + 1]
          const nextDate = new Date(nextRecord.date)
          const daysDiff = differenceInDays(nextDate, recordDate)
          
          if (daysDiff > 1 || !nextRecord.is_complete) {
            // Streak is broken
            if (tempStreak > longestStreak) {
              longestStreak = tempStreak
            }
            
            // Reset for next potential streak
            tempStreak = 0
            streakStartDate = null
          }
        }
      } else {
        // Day not complete, streak is broken
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak
        }
        tempStreak = 0
        streakStartDate = null
      }
    }

    // Final check for longest streak
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak
    }

    // Check if current streak is still active
    const lastRecord = sortedRecords[sortedRecords.length - 1]
    const isActiveStreak = lastCompletedDate && lastRecord ? 
      (lastRecord.date === todayStr || differenceInDays(today, lastCompletedDate) <= 1) : 
      false

    if (!isActiveStreak) {
      currentStreak = 0
    }

    // Calculate completion rate
    const totalDays = sortedRecords.length
    const completionRate = totalDays > 0 ? (totalCompletedDays / totalDays) * 100 : 0

    return {
      currentStreak,
      longestStreak,
      streakStartDate: currentStreakStart,
      streakEndDate: isActiveStreak ? today : lastCompletedDate,
      totalCompletedDays,
      completionRate: Math.round(completionRate),
      isActiveStreak,
      lastCompletedDate
    }
  }

  async getStreakHistory(challengeId: string): Promise<StreakHistory[]> {
    const supabase = await createClient()
    
    const { data: progressRecords, error } = await supabase
      .from('daily_progress')
      .select('date, is_complete')
      .eq('challenge_id', challengeId)
      .order('date', { ascending: true })

    if (error || !progressRecords) {
      return []
    }

    const streaks: StreakHistory[] = []
    let currentStreak: StreakHistory | null = null

    for (let i = 0; i < progressRecords.length; i++) {
      const record = progressRecords[i]
      const recordDate = new Date(record.date)

      if (record.is_complete) {
        if (!currentStreak) {
          // Start new streak
          currentStreak = {
            startDate: recordDate,
            endDate: recordDate,
            length: 1,
            isActive: false
          }
        } else {
          // Continue streak
          currentStreak.endDate = recordDate
          currentStreak.length++
        }
      } else if (currentStreak) {
        // End current streak
        streaks.push(currentStreak)
        currentStreak = null
      }
    }

    // Add final streak if exists
    if (currentStreak) {
      currentStreak.isActive = true
      streaks.push(currentStreak)
    }

    return streaks
  }

  async getMilestones(challengeId: string): Promise<{
    reached: number[]
    next: number | null
    upcoming: number[]
  }> {
    const { totalCompletedDays } = await this.getStreakData(challengeId)
    
    const milestones = [7, 14, 21, 30, 40, 50, 60, 70, 75]
    const reached = milestones.filter(m => totalCompletedDays >= m)
    const upcoming = milestones.filter(m => totalCompletedDays < m)
    const next = upcoming.length > 0 ? upcoming[0] : null

    return { reached, next, upcoming }
  }
}

export const streakTrackingService = StreakTrackingService.getInstance()