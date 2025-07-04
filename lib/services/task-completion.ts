import { createClient } from '@/lib/supabase/client'

export interface TaskCompletionData {
  taskDefinitionId: string
  completed: boolean
  duration?: number
  notes?: string
  photoUrl?: string
}

class TaskCompletionService {
  private supabase = createClient()

  /**
   * Mark a task as completed automatically from tracking tools
   */
  async completeTask(
    taskDefinitionId: string, 
    data: { duration?: number; notes?: string; photoUrl?: string } = {}
  ): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        console.error('No authenticated user for task completion')
        return false
      }

      // Get user's timezone
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('timezone')
        .eq('id', user.id)
        .single()
      
      const userTimezone = profile?.timezone || 'America/New_York'
      
      // Get today in user's timezone
      const now = new Date()
      const todayStr = now.toLocaleDateString('en-US', { 
        timeZone: userTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      const [month, day, year] = todayStr.split('/')
      const currentDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`

      // Get or create active challenge
      let { data: challenge } = await this.supabase
        .from('challenges')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      let activeChallengeId = challenge?.id

      // If no active challenge, create one
      if (!challenge) {
        const { data: newChallenge } = await this.supabase
          .from('challenges')
          .insert({
            user_id: user.id,
            name: '75 Hard Challenge',
            start_date: new Date().toISOString(),
            is_active: true
          })
          .select()
          .single()
        
        activeChallengeId = newChallenge?.id
      }

      if (!activeChallengeId) {
        console.error('No challenge ID available for task completion')
        return false
      }

      // Get current progress
      const { data: currentProgress, error: fetchError } = await this.supabase
        .from('daily_progress')
        .select('*')
        .eq('challenge_id', activeChallengeId)
        .eq('date', currentDateStr)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching progress:', fetchError)
        return false
      }

      const existingTasks = currentProgress?.tasks || {}
      const taskData = {
        ...existingTasks[taskDefinitionId],
        completed: true,
        completedAt: new Date().toISOString(),
        ...(data.duration && { duration: data.duration }),
        ...(data.notes && { notes: data.notes }),
        ...(data.photoUrl && { photoUrl: data.photoUrl })
      }

      const updatedTasks = {
        ...existingTasks,
        [taskDefinitionId]: taskData
      }

      const newCompletedCount = Object.values(updatedTasks).filter((t: any) => t.completed).length

      console.log(`Auto-completing task: ${taskDefinitionId}`, {
        challengeId: activeChallengeId,
        currentDateStr,
        newCompletedCount
      })

      // If we have existing progress, update it; otherwise insert
      if (currentProgress) {
        const { error } = await this.supabase
          .from('daily_progress')
          .update({
            tasks: updatedTasks,
            tasks_completed: newCompletedCount,
            is_complete: newCompletedCount === 6
          })
          .eq('id', currentProgress.id)

        if (error) {
          console.error('Error updating progress:', error)
          return false
        }
      } else {
        const { error } = await this.supabase
          .from('daily_progress')
          .insert({
            user_id: user.id,
            challenge_id: activeChallengeId,
            date: currentDateStr,
            tasks: updatedTasks,
            tasks_completed: newCompletedCount,
            is_complete: newCompletedCount === 6
          })

        if (error) {
          console.error('Error inserting progress:', error)
          return false
        }
      }

      console.log(`Successfully auto-completed task: ${taskDefinitionId}`)
      return true
    } catch (error) {
      console.error('Error in completeTask:', error)
      return false
    }
  }

  /**
   * Check if a specific task is already completed today
   */
  async isTaskCompletedToday(taskDefinitionId: string): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return false

      // Get user's timezone
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('timezone')
        .eq('id', user.id)
        .single()
      
      const userTimezone = profile?.timezone || 'America/New_York'
      
      // Get today in user's timezone
      const now = new Date()
      const todayStr = now.toLocaleDateString('en-US', { 
        timeZone: userTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      const [month, day, year] = todayStr.split('/')
      const currentDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`

      // Get active challenge
      const { data: challenge } = await this.supabase
        .from('challenges')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (!challenge) return false

      // Check current progress
      const { data: currentProgress } = await this.supabase
        .from('daily_progress')
        .select('tasks')
        .eq('challenge_id', challenge.id)
        .eq('date', currentDateStr)
        .single()

      return currentProgress?.tasks?.[taskDefinitionId]?.completed || false
    } catch (error) {
      console.error('Error checking task completion:', error)
      return false
    }
  }
}

export const taskCompletionService = new TaskCompletionService()

// Helper functions for specific task types
export const taskHelpers = {
  async completeProgressPhoto(photoUrl: string): Promise<boolean> {
    return taskCompletionService.completeTask('progress-photo', { photoUrl })
  },

  async completeIndoorWorkout(duration: number, notes?: string): Promise<boolean> {
    return taskCompletionService.completeTask('workout-indoor', { duration, notes })
  },

  async completeOutdoorWorkout(duration: number, notes?: string): Promise<boolean> {
    return taskCompletionService.completeTask('workout-outdoor', { duration, notes })
  },

  async completeWaterIntake(): Promise<boolean> {
    return taskCompletionService.completeTask('water-intake')
  },

  async checkIfTaskCompleted(taskDefinitionId: string): Promise<boolean> {
    return taskCompletionService.isTaskCompletedToday(taskDefinitionId)
  }
} 