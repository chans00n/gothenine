import { createClient } from '@/lib/supabase/client'
import { dailyProgressService } from './daily-progress'
import { waterIntakeService } from './water-intake'
import { workoutHistoryService } from './workout-history'
import { walkHistoryService } from './walk-history'
import { photoUploadService } from './photo-upload'
import { dailyNotesService } from './daily-notes'
import type { DailyProgress, TaskProgress } from '@/types/database'
import { toast } from '@/lib/toast'
import { taskDefinitions, type TaskType } from '@/components/checklist/task-definitions'
import { formatDateForDB, getUserTimezone, getTodayInTimezone } from '@/lib/utils/timezone'

export interface DailyProgressAggregation {
  date: string
  challengeId: string
  progress: DailyProgress | null
  waterIntake: {
    count: number
    goal: number
    isComplete: boolean
  }
  workouts: {
    indoor: boolean
    outdoor: boolean
    count: number
  }
  walk: {
    completed: boolean
    duration?: number
    distance?: number
  }
  photos: {
    count: number
    urls: string[]
  }
  reading: {
    completed: boolean
  }
  diet: {
    completed: boolean
  }
  notes: {
    hasNotes: boolean
    content?: string
  }
  isComplete: boolean
  tasksCompleted: number
  totalTasks: number
}

export interface StreakInfo {
  currentStreak: number
  longestStreak: number
  totalDaysCompleted: number
  startDate: Date
  lastCompletedDate?: Date
  isActive: boolean
}

export class ProgressAggregationService {
  private static instance: ProgressAggregationService
  private supabase = createClient()
  private requestCache = new Map<string, { data: any, timestamp: number }>()
  private readonly CACHE_TTL = 1000 // 1 second cache

  private constructor() {}

  static getInstance(): ProgressAggregationService {
    if (!ProgressAggregationService.instance) {
      ProgressAggregationService.instance = new ProgressAggregationService()
    }
    return ProgressAggregationService.instance
  }

  // Get complete daily progress aggregation
  async getDailyAggregation(challengeId: string, date: Date): Promise<DailyProgressAggregation> {
    const dateStr = formatDateForDB(date)
    
    // Check cache first
    const cacheKey = `${challengeId}-${dateStr}`
    const cached = this.requestCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }
    
    // Fetch all data in parallel
    const [
      progress,
      waterData,
      workouts,
      walks,
      photos,
      notes
    ] = await Promise.all([
      dailyProgressService.getProgress(challengeId, date).catch(err => {
        console.error('Error fetching daily progress:', err)
        return null
      }),
      waterIntakeService.getIntakeForDate(challengeId, dateStr).catch(err => {
        console.error('Error fetching water intake:', err)
        return null
      }),
      workoutHistoryService.getWorkoutsForDate(challengeId, date).catch(err => {
        console.error('Error fetching workouts:', err)
        return []
      }),
      walkHistoryService.getWalksForDate(challengeId, date).catch(err => {
        console.error('Error fetching walks:', err)
        return []
      }),
      photoUploadService.getPhotosForDate(challengeId, date).catch(err => {
        console.error('Error fetching photos:', err)
        return []
      }),
      dailyNotesService.getNote(challengeId, date).catch(err => {
        console.error('Error fetching notes:', err)
        return null
      })
    ])



    // Calculate task completion from progress record
    const tasks = progress?.tasks || {}
    
    // Check water from both sources
    const waterComplete = tasks['water-intake']?.completed || tasks['water_intake']?.completed || 
      (waterData ? waterData.amount >= waterData.goal : false)
    
    // Check workouts from both progress and workout history
    const indoorWorkoutComplete = tasks['workout-indoor']?.completed || 
      (workouts && workouts.some(w => w.type === 'indoor' && w.duration >= 45))
    const outdoorWorkoutComplete = tasks['workout-outdoor']?.completed || 
      (workouts && workouts.some(w => w.type === 'outdoor' && w.duration >= 45))
    
    // Note: There's no separate walk task in 75 Hard - outdoor workout covers this
    
    // Check photos from progress
    const photosComplete = tasks['progress-photo']?.completed || 
      (photos && photos.length > 0)
    
    // Check manual tasks
    const readingComplete = tasks['read-nonfiction']?.completed || false
    const dietComplete = tasks['follow-diet']?.completed || false


    // Count completed tasks - 75 Hard requires:
    // 1. Indoor workout (45 min)
    // 2. Outdoor workout (45 min) 
    // 3. Follow diet
    // 4. Drink 1 gallon water
    // 5. Read 10 pages
    // 6. Progress photo
    const actualTasksCompleted = [
      waterComplete,
      indoorWorkoutComplete,
      outdoorWorkoutComplete,
      photosComplete,
      readingComplete,
      dietComplete
    ].filter(Boolean).length

    const isComplete = actualTasksCompleted === 6

    const aggregation: DailyProgressAggregation = {
      date: dateStr,
      challengeId,
      progress,
      waterIntake: {
        count: waterData?.amount || 0,
        goal: waterData?.goal || 128,
        isComplete: waterComplete
      },
      workouts: {
        indoor: indoorWorkoutComplete,
        outdoor: outdoorWorkoutComplete,
        count: workouts.length
      },
      walk: {
        completed: false, // Walk is not a separate task in 75 Hard
        duration: undefined,
        distance: undefined
      },
      photos: {
        count: photos.length,
        urls: photos.map(p => p.photo_url)
      },
      reading: {
        completed: readingComplete
      },
      diet: {
        completed: dietComplete
      },
      notes: {
        hasNotes: !!notes,
        content: notes?.content
      },
      isComplete,
      tasksCompleted: actualTasksCompleted,
      totalTasks: 6
    }
    
    // Cache the result
    this.requestCache.set(cacheKey, {
      data: aggregation,
      timestamp: Date.now()
    })
    
    return aggregation
  }

  // Update daily progress based on component updates
  async updateFromComponent(
    challengeId: string,
    date: Date,
    component: 'water' | 'workout' | 'walk' | 'photo' | 'reading' | 'diet',
    data?: any
  ): Promise<void> {
    const aggregation = await this.getDailyAggregation(challengeId, date)
    const tasks: Record<string, TaskProgress> = {}

    // Water intake
    tasks.water = {
      completed: aggregation.waterIntake.isComplete,
      completedAt: aggregation.waterIntake.isComplete ? new Date().toISOString() : null
    }

    // Workouts
    tasks.workout = {
      completed: aggregation.workouts.indoor && aggregation.workouts.outdoor,
      completedAt: (aggregation.workouts.indoor && aggregation.workouts.outdoor) 
        ? new Date().toISOString() : null
    }

    // Walk
    tasks.walk = {
      completed: aggregation.walk.completed,
      completedAt: aggregation.walk.completed ? new Date().toISOString() : null
    }

    // Photos
    tasks.photos = {
      completed: aggregation.photos.count > 0,
      completedAt: aggregation.photos.count > 0 ? new Date().toISOString() : null
    }

    // Reading (manual)
    if (component === 'reading') {
      tasks.reading = {
        completed: data?.completed || false,
        completedAt: data?.completed ? new Date().toISOString() : null
      }
    } else {
      tasks.reading = aggregation.progress?.tasks?.reading || {
        completed: false,
        completedAt: null
      }
    }

    // Diet (manual)
    if (component === 'diet') {
      tasks.diet = {
        completed: data?.completed || false,
        completedAt: data?.completed ? new Date().toISOString() : null
      }
    } else {
      tasks.diet = aggregation.progress?.tasks?.diet || {
        completed: false,
        completedAt: null
      }
    }

    // Update daily progress
    await dailyProgressService.batchUpdateTasks(challengeId, date, tasks)

    // Check for daily completion
    const completedCount = Object.values(tasks).filter(t => t.completed).length
    if (completedCount === 6 && !aggregation.isComplete) {
      await this.celebrateCompletion(challengeId, date)
    }
  }

  // Get streak information
  async getStreakInfo(challengeId: string): Promise<StreakInfo> {
    try {
      // Get challenge start date
      const { data: challenge } = await this.supabase
        .from('challenges')
        .select('created_at')
        .eq('id', challengeId)
        .single()

      if (!challenge) {
        throw new Error('Challenge not found')
      }

      // Get all completed days
      const { data: completedDays } = await this.supabase
        .from('daily_progress')
        .select('date, is_complete')
        .eq('challenge_id', challengeId)
        .eq('is_complete', true)
        .order('date', { ascending: true })

      if (!completedDays || completedDays.length === 0) {
        return {
          currentStreak: 0,
          longestStreak: 0,
          totalDaysCompleted: 0,
          startDate: new Date(challenge.created_at),
          isActive: true
        }
      }

      // Calculate streaks
      let currentStreak = 0
      let longestStreak = 0
      let tempStreak = 1
      let lastDate = new Date(completedDays[0].date)
      let lastCompletedDate = new Date(completedDays[completedDays.length - 1].date)

      for (let i = 1; i < completedDays.length; i++) {
        const currentDate = new Date(completedDays[i].date)
        const daysDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

        if (daysDiff === 1) {
          tempStreak++
        } else {
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 1
        }

        lastDate = currentDate
      }

      longestStreak = Math.max(longestStreak, tempStreak)

      // Check if streak is current
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const lastCompletedDateStr = formatDateForDB(lastCompletedDate)
      const todayStr = formatDateForDB(today)
      const yesterdayStr = formatDateForDB(yesterday)

      if (lastCompletedDateStr === todayStr || lastCompletedDateStr === yesterdayStr) {
        currentStreak = tempStreak
      }

      return {
        currentStreak,
        longestStreak,
        totalDaysCompleted: completedDays.length,
        startDate: new Date(challenge.created_at),
        lastCompletedDate,
        isActive: currentStreak > 0
      }
    } catch (error) {
      console.error('Error calculating streak:', error)
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalDaysCompleted: 0,
        startDate: new Date(),
        isActive: false
      }
    }
  }

  // Validate daily completion
  async validateDailyCompletion(challengeId: string, date: Date): Promise<{
    isValid: boolean
    missingTasks: string[]
    completedTasks: string[]
  }> {
    const aggregation = await this.getDailyAggregation(challengeId, date)
    
    const taskStatus = {
      water: aggregation.waterIntake.isComplete,
      'indoor workout': aggregation.workouts.indoor,
      'outdoor workout': aggregation.workouts.outdoor,
      walk: aggregation.walk.completed,
      photos: aggregation.photos.count > 0,
      reading: aggregation.reading.completed,
      diet: aggregation.diet.completed
    }

    const completedTasks = Object.entries(taskStatus)
      .filter(([_, completed]) => completed)
      .map(([task]) => task)

    const missingTasks = Object.entries(taskStatus)
      .filter(([_, completed]) => !completed)
      .map(([task]) => task)

    return {
      isValid: missingTasks.length === 0,
      missingTasks,
      completedTasks
    }
  }

  // Celebrate completion
  private async celebrateCompletion(challengeId: string, date: Date): Promise<void> {
    const streakInfo = await this.getStreakInfo(challengeId)
    
    // Show celebration toast
    toast.success(
      '🎉 Day Complete!',
      `Congratulations! You've completed Day ${streakInfo.totalDaysCompleted} of your 75 Hard journey!`
    )

    // Check for milestone achievements
    if (streakInfo.totalDaysCompleted === 75) {
      toast.success(
        '🏆 Challenge Complete!',
        "You've completed the entire 75 Hard challenge! You are a champion!"
      )
    } else if (streakInfo.totalDaysCompleted % 10 === 0) {
      toast.success(
        '🎯 Milestone Reached!',
        `${streakInfo.totalDaysCompleted} days completed! Keep going!`
      )
    }

    // Update challenge if completed
    if (streakInfo.totalDaysCompleted === 75) {
      await this.supabase
        .from('challenges')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', challengeId)
    }
  }

  // Get progress summary for date range
  async getProgressSummary(
    challengeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalDays: number
    completedDays: number
    completionRate: number
    taskBreakdown: Record<string, number>
    dailyProgress: DailyProgressAggregation[]
  }> {
    const days = []
    const current = new Date(startDate)
    
    while (current <= endDate) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    const dailyProgress = await Promise.all(
      days.map(date => this.getDailyAggregation(challengeId, date))
    )

    const completedDays = dailyProgress.filter(d => d.isComplete).length
    
    const taskBreakdown = {
      water: dailyProgress.filter(d => d.waterIntake.isComplete).length,
      workout: dailyProgress.filter(d => d.workouts.indoor && d.workouts.outdoor).length,
      walk: dailyProgress.filter(d => d.walk.completed).length,
      photos: dailyProgress.filter(d => d.photos.count > 0).length,
      reading: dailyProgress.filter(d => d.reading.completed).length,
      diet: dailyProgress.filter(d => d.diet.completed).length
    }

    return {
      totalDays: days.length,
      completedDays,
      completionRate: (completedDays / days.length) * 100,
      taskBreakdown,
      dailyProgress
    }
  }

}

// Export singleton instance
export const progressAggregationService = ProgressAggregationService.getInstance()