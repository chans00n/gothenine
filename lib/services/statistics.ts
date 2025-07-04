import { createClient } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, subWeeks, subMonths, addDays } from 'date-fns'
import { getTodayInTimezone, formatDateForDB } from '@/lib/utils/timezone'

export interface TaskStatistics {
  taskId: string
  taskName: string
  completionRate: number
  totalCompleted: number
  totalDays: number
  streakData: {
    current: number
    longest: number
  }
}

export interface WeeklyStats {
  weekStartDate: Date
  weekEndDate: Date
  daysCompleted: number
  totalDays: number
  completionRate: number
  tasksBreakdown: TaskStatistics[]
  perfectDays: number
}

export interface MonthlyStats {
  month: string
  year: number
  daysCompleted: number
  totalDays: number
  completionRate: number
  weeklyBreakdown: WeeklyStats[]
  bestWeek: WeeklyStats | null
  worstWeek: WeeklyStats | null
}

export interface ProgressTrend {
  date: Date
  completionRate: number
  tasksCompleted: number
  dayNumber: number
}

export class StatisticsService {
  private static instance: StatisticsService

  static getInstance(): StatisticsService {
    if (!StatisticsService.instance) {
      StatisticsService.instance = new StatisticsService()
    }
    return StatisticsService.instance
  }

  async getOverallStatistics(challengeId: string, timezone: string = 'America/New_York'): Promise<{
    totalDays: number
    completedDays: number
    partialDays: number
    missedDays: number
    completionRate: number
    averageTasksPerDay: number
    taskBreakdown: TaskStatistics[]
  }> {
    const supabase = await createClient()
    
    const { data: progressRecords, error } = await supabase
      .from('daily_progress')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('date', { ascending: true })

    if (error || !progressRecords) {
      throw new Error('Failed to fetch progress records')
    }

    const totalDays = progressRecords.length
    const completedDays = progressRecords.filter(r => r.is_complete).length
    const partialDays = progressRecords.filter(r => !r.is_complete && r.tasks_completed > 0).length
    const missedDays = progressRecords.filter(r => r.tasks_completed === 0).length
    
    const totalTasksCompleted = progressRecords.reduce((sum, r) => sum + (r.tasks_completed || 0), 0)
    const averageTasksPerDay = totalDays > 0 ? totalTasksCompleted / totalDays : 0

    // Calculate task breakdown
    const taskBreakdown = await this.getTaskBreakdown(progressRecords)

    return {
      totalDays,
      completedDays,
      partialDays,
      missedDays,
      completionRate: totalDays > 0 ? (completedDays / totalDays) * 100 : 0,
      averageTasksPerDay: Math.round(averageTasksPerDay * 10) / 10,
      taskBreakdown
    }
  }

  async getWeeklyStats(challengeId: string, weekOffset: number = 0, timezone: string = 'America/New_York'): Promise<WeeklyStats> {
    const supabase = await createClient()
    const today = getTodayInTimezone(timezone)
    const targetWeek = subWeeks(today, weekOffset)
    const weekStart = startOfWeek(targetWeek, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(targetWeek, { weekStartsOn: 0 })

    const { data: progressRecords, error } = await supabase
      .from('daily_progress')
      .select('*')
      .eq('challenge_id', challengeId)
      .gte('date', formatDateForDB(weekStart))
      .lte('date', formatDateForDB(weekEnd))
      .order('date', { ascending: true })

    if (error) {
      throw new Error('Failed to fetch weekly stats')
    }

    const daysCompleted = progressRecords?.filter(r => r.is_complete).length || 0
    const perfectDays = daysCompleted
    const totalDays = progressRecords?.length || 0
    const tasksBreakdown = await this.getTaskBreakdown(progressRecords || [])

    return {
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      daysCompleted,
      totalDays,
      completionRate: totalDays > 0 ? (daysCompleted / totalDays) * 100 : 0,
      tasksBreakdown,
      perfectDays
    }
  }

  async getMonthlyStats(challengeId: string, monthOffset: number = 0, timezone: string = 'America/New_York'): Promise<MonthlyStats> {
    const supabase = await createClient()
    const today = getTodayInTimezone(timezone)
    const targetMonth = subMonths(today, monthOffset)
    const monthStart = startOfMonth(targetMonth)
    const monthEnd = endOfMonth(targetMonth)

    const { data: progressRecords, error } = await supabase
      .from('daily_progress')
      .select('*')
      .eq('challenge_id', challengeId)
      .gte('date', formatDateForDB(monthStart))
      .lte('date', formatDateForDB(monthEnd))
      .order('date', { ascending: true })

    if (error) {
      throw new Error('Failed to fetch monthly stats')
    }

    const daysCompleted = progressRecords?.filter(r => r.is_complete).length || 0
    const totalDays = progressRecords?.length || 0

    // Get weekly breakdown for the month
    const weeklyBreakdown: WeeklyStats[] = []
    let currentWeekStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    
    while (currentWeekStart <= monthEnd) {
      const weekStats = await this.getWeeklyStatsForDateRange(
        challengeId,
        currentWeekStart,
        endOfWeek(currentWeekStart, { weekStartsOn: 0 })
      )
      if (weekStats.totalDays > 0) {
        weeklyBreakdown.push(weekStats)
      }
      currentWeekStart = addDays(currentWeekStart, 7)
    }

    const bestWeek = weeklyBreakdown.reduce((best, week) => 
      !best || week.completionRate > best.completionRate ? week : best, 
      null as WeeklyStats | null
    )

    const worstWeek = weeklyBreakdown.reduce((worst, week) => 
      !worst || week.completionRate < worst.completionRate ? week : worst, 
      null as WeeklyStats | null
    )

    return {
      month: format(targetMonth, 'MMMM'),
      year: targetMonth.getFullYear(),
      daysCompleted,
      totalDays,
      completionRate: totalDays > 0 ? (daysCompleted / totalDays) * 100 : 0,
      weeklyBreakdown,
      bestWeek,
      worstWeek
    }
  }

  async getProgressTrends(challengeId: string, days: number = 30): Promise<ProgressTrend[]> {
    const supabase = await createClient()
    
    const { data: challenge } = await supabase
      .from('challenges')
      .select('start_date')
      .eq('id', challengeId)
      .single()

    if (!challenge) {
      throw new Error('Challenge not found')
    }

    const { data: progressRecords, error } = await supabase
      .from('daily_progress')
      .select('date, tasks_completed, is_complete')
      .eq('challenge_id', challengeId)
      .order('date', { ascending: false })
      .limit(days)

    if (error) {
      throw new Error('Failed to fetch progress trends')
    }

    const startDate = new Date(challenge.start_date)
    
    return (progressRecords || []).map(record => {
      const recordDate = new Date(record.date)
      const dayNumber = Math.ceil((recordDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      
      return {
        date: recordDate,
        completionRate: record.is_complete ? 100 : (record.tasks_completed / 6) * 100,
        tasksCompleted: record.tasks_completed,
        dayNumber
      }
    }).reverse()
  }

  private async getTaskBreakdown(progressRecords: any[]): Promise<TaskStatistics[]> {
    const taskIds = [
      'water-intake',
      'workout-indoor',
      'workout-outdoor',
      'progress-photo',
      'read-nonfiction',
      'follow-diet'
    ]

    const taskNames: Record<string, string> = {
      'water-intake': 'Water Intake',
      'workout-indoor': 'Indoor Workout',
      'workout-outdoor': 'Outdoor Workout',
      'progress-photo': 'Progress Photo',
      'read-nonfiction': 'Read 10 Pages',
      'follow-diet': 'Follow Diet'
    }

    const taskStats: TaskStatistics[] = []

    for (const taskId of taskIds) {
      let totalCompleted = 0
      let currentStreak = 0
      let longestStreak = 0
      let tempStreak = 0

      // Sort records by date for streak calculation
      const sortedRecords = [...progressRecords].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      for (const record of sortedRecords) {
        const taskCompleted = record.tasks?.[taskId]?.completed || false
        
        if (taskCompleted) {
          totalCompleted++
          tempStreak++
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak
          }
        } else {
          tempStreak = 0
        }
      }

      // Current streak is the temp streak if it's still active
      currentStreak = tempStreak

      taskStats.push({
        taskId,
        taskName: taskNames[taskId],
        completionRate: progressRecords.length > 0 ? 
          (totalCompleted / progressRecords.length) * 100 : 0,
        totalCompleted,
        totalDays: progressRecords.length,
        streakData: {
          current: currentStreak,
          longest: longestStreak
        }
      })
    }

    return taskStats
  }

  private async getWeeklyStatsForDateRange(
    challengeId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<WeeklyStats> {
    const supabase = await createClient()
    
    const { data: progressRecords } = await supabase
      .from('daily_progress')
      .select('*')
      .eq('challenge_id', challengeId)
      .gte('date', formatDateForDB(startDate))
      .lte('date', formatDateForDB(endDate))

    const daysCompleted = progressRecords?.filter(r => r.is_complete).length || 0
    const totalDays = progressRecords?.length || 0
    const tasksBreakdown = await this.getTaskBreakdown(progressRecords || [])

    return {
      weekStartDate: startDate,
      weekEndDate: endDate,
      daysCompleted,
      totalDays,
      completionRate: totalDays > 0 ? (daysCompleted / totalDays) * 100 : 0,
      tasksBreakdown,
      perfectDays: daysCompleted
    }
  }
}

export const statisticsService = StatisticsService.getInstance()