import { createClient } from '@/lib/supabase/client'
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
  private supabase = createClient()

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
    const { data: progressRecords, error } = await this.supabase
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
    const today = getTodayInTimezone(timezone)
    const targetWeek = subWeeks(today, weekOffset)
    const weekStart = startOfWeek(targetWeek, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(targetWeek, { weekStartsOn: 0 })

    const { data: progressRecords, error } = await this.supabase
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
    const today = getTodayInTimezone(timezone)
    const targetMonth = subMonths(today, monthOffset)
    const monthStart = startOfMonth(targetMonth)
    const monthEnd = endOfMonth(targetMonth)

    const { data: progressRecords, error } = await this.supabase
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

  async getHistoricalData(challengeId: string, startDate: string, endDate: string, timezone: string) {
    const { data: progressData, error } = await this.supabase
      .from('daily_progress')
      .select('*')
      .eq('challenge_id', challengeId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching historical data:', error)
      return null
    }

    // Get photos count
    const { data: photos } = await this.supabase
      .from('progress_photos')
      .select('date, id')
      .eq('challenge_id', challengeId)
      .gte('date', startDate)
      .lte('date', endDate)

    const photosByDate = photos?.reduce((acc: any, photo) => {
      acc[photo.date] = true
      return acc
    }, {}) || {}

    // Get notes
    const { data: notes } = await this.supabase
      .from('daily_notes')
      .select('date, notes')
      .eq('challenge_id', challengeId)
      .gte('date', startDate)
      .lte('date', endDate)

    const notesByDate = notes?.reduce((acc: any, note) => {
      acc[note.date] = note.notes
      return acc
    }, {}) || {}

    // Calculate statistics
    const totalDays = progressData?.length || 0
    const completedDays = progressData?.filter(d => d.is_complete).length || 0
    const failedDays = totalDays - completedDays
    const totalTasks = totalDays * 6
    const completedTasks = progressData?.reduce((sum, d) => sum + (d.tasks_completed || 0), 0) || 0
    const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0

    // Calculate streaks
    let currentStreak = 0
    let bestStreak = 0
    let tempStreak = 0

    progressData?.forEach((day, index) => {
      if (day.is_complete) {
        tempStreak++
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak
        }
        if (index === progressData.length - 1) {
          currentStreak = tempStreak
        }
      } else {
        tempStreak = 0
      }
    })

    // Process daily data
    const dailyProgress = progressData?.map((day, index) => ({
      date: day.date,
      dayNumber: index + 1,
      completionRate: (day.tasks_completed / 6) * 100,
      tasksCompleted: day.tasks_completed,
      isComplete: day.is_complete,
      hasPhoto: !!photosByDate[day.date],
      notes: notesByDate[day.date] || null
    })) || []

    // Get task breakdown
    const taskIds = ['water-intake', 'workout-indoor', 'workout-outdoor', 'follow-diet', 'read-nonfiction', 'progress-photo']
    const taskNames: Record<string, string> = {
      'water-intake': 'Water Intake',
      'workout-indoor': 'Indoor Workout', 
      'workout-outdoor': 'Outdoor Workout',
      'follow-diet': 'Follow Diet',
      'read-nonfiction': 'Read 10 Pages',
      'progress-photo': 'Progress Photo'
    }

    const taskBreakdown = taskIds.map(taskId => {
      const completionData = progressData?.map(day => ({
        date: day.date,
        completed: day.task_status?.[taskId] || false
      })) || []

      return {
        taskId,
        taskName: taskNames[taskId],
        completionData
      }
    })

    // Calculate milestones
    const milestonesDays = [7, 14, 21, 30, 40, 50, 60, 70, 75]
    const milestones = milestonesDays.map(day => {
      const reached = completedDays >= day
      const dayData = progressData?.[day - 1]
      return {
        day,
        reached,
        date: dayData?.date || null
      }
    })

    // Calculate trends (compare to previous period)
    const periodLength = progressData?.length || 0
    const prevStartDate = format(addDays(new Date(startDate), -periodLength), 'yyyy-MM-dd')
    const prevEndDate = startDate

    const { data: prevData } = await this.supabase
      .from('daily_progress')
      .select('*')
      .eq('challenge_id', challengeId)
      .gte('date', prevStartDate)
      .lt('date', prevEndDate)

    const prevCompletedDays = prevData?.filter(d => d.is_complete).length || 0
    const prevTotalDays = prevData?.length || 0
    const prevCompletionRate = prevTotalDays > 0 ? (prevCompletedDays / prevTotalDays) * 100 : 0
    const prevAvgTasks = prevTotalDays > 0 ? 
      (prevData?.reduce((sum, d) => sum + (d.tasks_completed || 0), 0) || 0) / prevTotalDays : 0
    const avgTasksPerDay = totalDays > 0 ? completedTasks / totalDays : 0

    return {
      totalDays,
      completedDays,
      failedDays,
      totalTasks,
      completedTasks,
      completionRate,
      bestStreak,
      currentStreak,
      averageTasksPerDay: avgTasksPerDay,
      dailyProgress,
      taskBreakdown,
      milestones,
      trends: {
        completionRate: completionRate - prevCompletionRate,
        tasksPerDay: avgTasksPerDay - prevAvgTasks
      }
    }
  }

  async getProgressTrends(challengeId: string, days: number = 30): Promise<ProgressTrend[]> {
    const { data: challenge } = await this.supabase
      .from('challenges')
      .select('start_date')
      .eq('id', challengeId)
      .single()

    if (!challenge) {
      throw new Error('Challenge not found')
    }

    const { data: progressRecords, error } = await this.supabase
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
    const { data: progressRecords } = await this.supabase
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