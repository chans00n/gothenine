import { createClient } from '@/lib/supabase/client'
import type { Database, DailyProgress, TaskProgress } from '@/types/database'
import { toast } from '@/lib/toast'
import { queueOfflineAction } from './sync-service'
import { getUserTimezone, getDateInUserTimezone, formatDateForDB } from '@/lib/utils/timezone'

// Local storage keys
const CACHED_PROGRESS_KEY = '75hard_cached_progress'

export class DailyProgressService {
  private static instance: DailyProgressService
  private supabase = createClient()

  private constructor() {}

  static getInstance(): DailyProgressService {
    if (!DailyProgressService.instance) {
      DailyProgressService.instance = new DailyProgressService()
    }
    return DailyProgressService.instance
  }

  // Get progress for a specific date
  async getProgress(challengeId: string, date: Date): Promise<DailyProgress | null> {
    // Format date for database
    const dateStr = formatDateForDB(date)
    
    // Check cache first
    const cached = this.getCachedProgress(challengeId, dateStr)
    if (cached && !navigator.onLine) {
      return cached
    }

    try {
      const { data, error } = await this.supabase
        .from('daily_progress')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('date', dateStr)
        .maybeSingle()

      if (error) {
        console.error('Error fetching daily progress:', error)
        return null
      }


      // Cache the result
      if (data) {
        this.cacheProgress(data)
      }

      return data
    } catch (error) {
      console.error('Error fetching progress:', error)
      // Return cached version if available
      return cached
    }
  }


  // Update task progress with optimistic updates
  async updateTaskProgress(
    challengeId: string,
    date: Date,
    taskId: string,
    updates: Partial<TaskProgress>
  ): Promise<void> {
    const dateStr = formatDateForDB(date)
    
    // Get current progress
    const currentProgress = await this.getProgress(challengeId, date)
    
    // Prepare updated tasks
    const updatedTasks = {
      ...(currentProgress?.tasks || {}),
      [taskId]: {
        ...(currentProgress?.tasks?.[taskId] || { completed: false, completedAt: null }),
        ...updates
      }
    }

    // Calculate completed count
    const completedCount = Object.values(updatedTasks).filter(
      (task: any) => task.completed
    ).length

    const progressData: Partial<DailyProgress> = {
      challenge_id: challengeId,
      date: dateStr,
      tasks: updatedTasks,
      tasks_completed: completedCount,
      is_complete: completedCount === 6
    }

    // Optimistically update cache
    this.cacheProgress({
      ...currentProgress,
      ...progressData
    } as DailyProgress)

    // If offline, queue the update
    if (!navigator.onLine) {
      queueOfflineAction(
        'daily_progress',
        currentProgress ? 'update' : 'create',
        'daily_progress',
        progressData
      )
      toast.info('Offline', 'Your progress will be saved when you reconnect')
      return
    }

    // Perform the update
    try {
      const { error } = await this.supabase
        .from('daily_progress')
        .upsert(progressData)

      if (error) throw error

      // Show success feedback
      if (updates.completed && completedCount === 6) {
        toast.success('Day Complete!', 'Congratulations on completing all tasks!')
      }
    } catch (error) {
      console.error('Error updating progress:', error)
      
      // Queue for retry
      queueOfflineAction(
        'daily_progress',
        currentProgress ? 'update' : 'create',
        'daily_progress',
        progressData
      )
      
      toast.error('Update Failed', 'We&apos;ll retry when connection is restored')
    }
  }

  // Batch update multiple tasks
  async batchUpdateTasks(
    challengeId: string,
    date: Date,
    taskUpdates: Record<string, Partial<TaskProgress>>
  ): Promise<void> {
    const dateStr = formatDateForDB(date)
    const currentProgress = await this.getProgress(challengeId, date)
    
    // Merge all updates
    const updatedTasks = { ...(currentProgress?.tasks || {}) }
    
    Object.entries(taskUpdates).forEach(([taskId, updates]) => {
      updatedTasks[taskId] = {
        ...(updatedTasks[taskId] || { completed: false, completedAt: null }),
        ...updates
      }
    })

    const completedCount = Object.values(updatedTasks).filter(
      (task: any) => task.completed
    ).length

    const progressData: Partial<DailyProgress> = {
      challenge_id: challengeId,
      date: dateStr,
      tasks: updatedTasks,
      tasks_completed: completedCount,
      is_complete: completedCount === 6
    }

    // Update cache
    this.cacheProgress({
      ...currentProgress,
      ...progressData
    } as DailyProgress)

    if (!navigator.onLine) {
      queueOfflineAction(
        'daily_progress',
        currentProgress ? 'update' : 'create',
        'daily_progress',
        progressData
      )
      toast.info('Offline', 'Your progress will be saved when you reconnect')
      return
    }

    try {
      const { error } = await this.supabase
        .from('daily_progress')
        .upsert(progressData)

      if (error) throw error
    } catch (error) {
      console.error('Error batch updating tasks:', error)
      queueOfflineAction(
        'daily_progress',
        currentProgress ? 'update' : 'create',
        'daily_progress',
        progressData
      )
      toast.error('Update Failed', 'We\'ll retry when connection is restored')
    }
  }

  // Get progress for date range
  async getProgressRange(
    challengeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailyProgress[]> {
    try {
      const { data, error } = await this.supabase
        .from('daily_progress')
        .select('*')
        .eq('challenge_id', challengeId)
        .gte('date', formatDateForDB(startDate))
        .lte('date', formatDateForDB(endDate))
        .order('date', { ascending: true })

      if (error) throw error

      // Cache all results
      data?.forEach(progress => this.cacheProgress(progress))

      return data || []
    } catch (error) {
      console.error('Error fetching progress range:', error)
      
      // Return cached data if available
      return this.getCachedProgressRange(challengeId, startDate, endDate)
    }
  }

  // Subscribe to real-time updates
  subscribeToUpdates(
    challengeId: string,
    callback: (progress: DailyProgress) => void
  ) {
    const subscription = this.supabase
      .channel(`progress:${challengeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_progress',
          filter: `challenge_id=eq.${challengeId}`
        },
        (payload) => {
          if (payload.new) {
            const progress = payload.new as DailyProgress
            this.cacheProgress(progress)
            callback(progress)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  // Private helper methods

  private getCacheKey(challengeId: string, date: string): string {
    return `${CACHED_PROGRESS_KEY}_${challengeId}_${date}`
  }

  private cacheProgress(progress: DailyProgress): void {
    if (typeof window === 'undefined') return
    
    const key = this.getCacheKey(progress.challenge_id, progress.date)
    localStorage.setItem(key, JSON.stringify(progress))
  }

  private getCachedProgress(challengeId: string, date: string): DailyProgress | null {
    if (typeof window === 'undefined') return null
    
    const key = this.getCacheKey(challengeId, date)
    const cached = localStorage.getItem(key)
    
    return cached ? JSON.parse(cached) : null
  }

  private getCachedProgressRange(
    challengeId: string,
    startDate: Date,
    endDate: Date
  ): DailyProgress[] {
    if (typeof window === 'undefined') return []
    
    const progress: DailyProgress[] = []
    const current = new Date(startDate)
    
    while (current <= endDate) {
      const cached = this.getCachedProgress(challengeId, formatDateForDB(current))
      if (cached) {
        progress.push(cached)
      }
      current.setDate(current.getDate() + 1)
    }
    
    return progress
  }

}

// Export singleton instance
export const dailyProgressService = DailyProgressService.getInstance()