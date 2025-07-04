import { createClient } from '@/lib/supabase/client'
import { queueOfflineAction } from './sync-service'

interface WorkoutHistory {
  id: string
  challenge_id: string
  duration: number
  completed_at: string
  created_at: string
}

export class WorkoutHistoryService {
  private static instance: WorkoutHistoryService
  private supabase = createClient()
  
  private constructor() {}

  static getInstance(): WorkoutHistoryService {
    if (!WorkoutHistoryService.instance) {
      WorkoutHistoryService.instance = new WorkoutHistoryService()
    }
    return WorkoutHistoryService.instance
  }

  // Save workout completion
  async saveWorkout(challengeId: string, duration: number): Promise<WorkoutHistory | null> {
    const workoutData = {
      challenge_id: challengeId,
      duration,
      completed_at: new Date().toISOString()
    }

    try {
      const { data, error } = await this.supabase
        .from('workout_history')
        .insert(workoutData)
        .select()
        .single()

      if (error) {
        console.error('Error saving workout:', error)
        
        // Queue for offline sync
        queueOfflineAction(
          'workout_history',
          'create',
          'workout_history',
          workoutData
        )
        
        // Return a temporary object for UI consistency
        return {
          id: crypto.randomUUID(),
          ...workoutData,
          created_at: new Date().toISOString()
        }
      }

      return data
    } catch (error) {
      console.error('Error saving workout:', error)
      
      // Queue for offline sync
      queueOfflineAction(
        'workout_history',
        'create',
        'workout_history',
        workoutData
      )
      
      // Return a temporary object for UI consistency
      return {
        id: crypto.randomUUID(),
        ...workoutData,
        created_at: new Date().toISOString()
      }
    }
  }

  // Get workouts for specific date
  async getWorkoutsForDate(challengeId: string, date: Date): Promise<WorkoutHistory[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    try {
      const { data, error } = await this.supabase
        .from('workout_history')
        .select('*')
        .eq('challenge_id', challengeId)
        .gte('completed_at', startOfDay.toISOString())
        .lte('completed_at', endOfDay.toISOString())
        .order('completed_at', { ascending: false })

      if (error) {
        console.error('Error fetching workouts for date:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getWorkoutsForDate:', error)
      return []
    }
  }

  // Get today's workouts
  async getTodayWorkouts(challengeId: string): Promise<WorkoutHistory[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    try {
      const { data, error } = await this.supabase
        .from('workout_history')
        .select('*')
        .eq('challenge_id', challengeId)
        .gte('completed_at', today.toISOString())
        .order('completed_at', { ascending: false })

      if (error) {
        console.error('Error fetching today\'s workouts:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error getting today\'s workouts:', error)
      return []
    }
  }

  // Get workout history
  async getWorkoutHistory(
    challengeId: string,
    days: number = 7
  ): Promise<WorkoutHistory[]> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    try {
      const { data, error } = await this.supabase
        .from('workout_history')
        .select('*')
        .eq('challenge_id', challengeId)
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString())
        .order('completed_at', { ascending: false })

      if (error) {
        console.error('Error fetching workout history:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error getting workout history:', error)
      return []
    }
  }

  // Get workout stats
  async getWorkoutStats(challengeId: string, days: number = 7): Promise<{
    count: number
    totalDuration: number
    avgDuration: number
  }> {
    const workouts = await this.getWorkoutHistory(challengeId, days)
    
    const count = workouts.length
    const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0)
    const avgDuration = count > 0 ? Math.floor(totalDuration / count) : 0

    return {
      count,
      totalDuration,
      avgDuration
    }
  }

  // Update daily progress after workout completion
  async updateDailyProgress(
    challengeId: string,
    workoutCount: number,
    duration: number
  ): Promise<void> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    try {
      const { data: progress } = await this.supabase
        .from('daily_progress')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('date', today.toISOString())
        .single()

      if (progress) {
        const tasks = progress.tasks || {}
        
        // Update the appropriate workout task
        if (workoutCount === 1) {
          tasks.workout_one = { completed: true, duration }
        } else if (workoutCount === 2) {
          tasks.workout_two = { completed: true, duration }
        }

        const tasksCompleted = Object.values(tasks).filter((t: any) => t.completed).length

        const updateData = {
          tasks,
          tasks_completed: tasksCompleted,
          is_complete: tasksCompleted === 6
        }

        const { error } = await this.supabase
          .from('daily_progress')
          .update(updateData)
          .eq('id', progress.id)

        if (error) {
          console.error('Error updating daily progress:', error)
          
          // Queue for offline sync
          queueOfflineAction(
            'daily_progress',
            'update',
            'daily_progress',
            { id: progress.id, ...updateData }
          )
        }
      }
    } catch (error) {
      console.error('Error updating daily progress:', error)
    }
  }
}

// Export singleton instance
export const workoutHistoryService = WorkoutHistoryService.getInstance()