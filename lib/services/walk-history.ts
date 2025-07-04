import { createClient } from '@/lib/supabase/client'
import { queueOfflineAction } from './sync-service'

interface WalkHistory {
  id: string
  challenge_id: string
  duration: number
  distance: number
  distance_unit: 'miles' | 'km'
  walk_type: 'outdoor' | 'indoor'
  notes?: string
  completed_at: string
  created_at: string
}

export class WalkHistoryService {
  private static instance: WalkHistoryService
  private supabase = createClient()
  
  private constructor() {}

  static getInstance(): WalkHistoryService {
    if (!WalkHistoryService.instance) {
      WalkHistoryService.instance = new WalkHistoryService()
    }
    return WalkHistoryService.instance
  }

  // Save walk completion
  async saveWalk(
    challengeId: string,
    duration: number,
    distance: number,
    distanceUnit: 'miles' | 'km',
    walkType: 'outdoor' | 'indoor' = 'outdoor',
    notes?: string
  ): Promise<WalkHistory | null> {
    const walkData = {
      challenge_id: challengeId,
      duration,
      distance,
      distance_unit: distanceUnit,
      walk_type: walkType,
      notes,
      completed_at: new Date().toISOString()
    }

    try {
      const { data, error } = await this.supabase
        .from('walk_history')
        .insert(walkData)
        .select()
        .single()

      if (error) {
        console.error('Error saving walk:', error)
        
        // Queue for offline sync
        queueOfflineAction(
          'walk_history',
          'create',
          'walk_history',
          walkData
        )
        
        // Return a temporary object for UI consistency
        return {
          id: crypto.randomUUID(),
          ...walkData,
          created_at: new Date().toISOString()
        }
      }

      return data
    } catch (error) {
      console.error('Error saving walk:', error)
      
      // Queue for offline sync
      queueOfflineAction(
        'walk_history',
        'create',
        'walk_history',
        walkData
      )
      
      // Return a temporary object for UI consistency
      return {
        id: crypto.randomUUID(),
        ...walkData,
        created_at: new Date().toISOString()
      }
    }
  }

  // Get walks for specific date
  async getWalksForDate(challengeId: string, date: Date): Promise<WalkHistory[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    try {
      const { data, error } = await this.supabase
        .from('walk_history')
        .select('*')
        .eq('challenge_id', challengeId)
        .gte('completed_at', startOfDay.toISOString())
        .lte('completed_at', endOfDay.toISOString())
        .order('completed_at', { ascending: false })

      if (error) {
        console.error('Error fetching walks for date:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getWalksForDate:', error)
      return []
    }
  }

  // Get today's walks
  async getTodayWalks(challengeId: string): Promise<WalkHistory[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    try {
      const { data, error } = await this.supabase
        .from('walk_history')
        .select('*')
        .eq('challenge_id', challengeId)
        .gte('completed_at', today.toISOString())
        .order('completed_at', { ascending: false })

      if (error) {
        console.error('Error fetching today\'s walks:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error getting today\'s walks:', error)
      return []
    }
  }

  // Get walk history
  async getWalkHistory(
    challengeId: string,
    days: number = 7
  ): Promise<WalkHistory[]> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    try {
      const { data, error } = await this.supabase
        .from('walk_history')
        .select('*')
        .eq('challenge_id', challengeId)
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString())
        .order('completed_at', { ascending: false })

      if (error) {
        console.error('Error fetching walk history:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error getting walk history:', error)
      return []
    }
  }

  // Get walk stats
  async getWalkStats(challengeId: string, days: number = 7): Promise<{
    count: number
    totalDistance: number
    totalDuration: number
    avgPace: number
  }> {
    const walks = await this.getWalkHistory(challengeId, days)
    
    const count = walks.length
    const totalDuration = walks.reduce((sum, w) => sum + w.duration, 0)
    
    // Convert all distances to miles for consistent stats
    const totalDistance = walks.reduce((sum, w) => {
      const distance = w.distance_unit === 'km' ? w.distance * 0.621371 : w.distance
      return sum + distance
    }, 0)
    
    const avgPace = totalDistance > 0 ? totalDuration / 60 / totalDistance : 0

    return {
      count,
      totalDistance,
      totalDuration,
      avgPace
    }
  }

  // Check if outdoor walk is completed today
  async hasCompletedOutdoorWalkToday(challengeId: string): Promise<boolean> {
    const walks = await this.getTodayWalks(challengeId)
    return walks.some(w => w.walk_type === 'outdoor')
  }

  // Update daily progress after walk completion
  async updateDailyProgress(
    challengeId: string,
    duration: number,
    distance: number,
    distanceUnit: 'miles' | 'km'
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
        tasks.outdoor_walk = { 
          completed: true, 
          duration, 
          distance,
          distance_unit: distanceUnit 
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

  // Convert distance between units
  convertDistance(distance: number, fromUnit: 'miles' | 'km', toUnit: 'miles' | 'km'): number {
    if (fromUnit === toUnit) return distance
    
    if (fromUnit === 'miles' && toUnit === 'km') {
      return distance * 1.60934
    } else {
      return distance * 0.621371
    }
  }

  // Format pace
  formatPace(minutesPerUnit: number): string {
    const paceMinutes = Math.floor(minutesPerUnit)
    const paceSeconds = Math.round((minutesPerUnit - paceMinutes) * 60)
    return `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}`
  }
}

// Export singleton instance
export const walkHistoryService = WalkHistoryService.getInstance()