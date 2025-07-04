import { createClient } from '@/lib/supabase/client'
import { queueOfflineAction } from './sync-service'
import { getUserTimezone, getTodayInTimezone, formatDateForDB } from '@/lib/utils/timezone'

interface WaterIntakeEntry {
  timestamp: string
  amount: number
  unit: string
}

interface WaterIntakeData {
  id: string
  challenge_id: string
  date: string
  amount: number
  goal: number
  unit: string
  intake_log: WaterIntakeEntry[]
}

export class WaterIntakeService {
  private static instance: WaterIntakeService
  private supabase = createClient()
  
  private constructor() {}

  static getInstance(): WaterIntakeService {
    if (!WaterIntakeService.instance) {
      WaterIntakeService.instance = new WaterIntakeService()
    }
    return WaterIntakeService.instance
  }

  // Get intake for specific date
  async getIntakeForDate(challengeId: string, date: string): Promise<WaterIntakeData | null> {
    try {
      const { data, error } = await this.supabase
        .from('water_intake')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('date', date)
        .maybeSingle()

      if (error) {
        console.error('Error fetching water intake:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getIntakeForDate:', error)
      return null
    }
  }

  // Get or create today's water intake record
  async getTodayIntake(challengeId: string): Promise<WaterIntakeData | null> {
    const timezone = await getUserTimezone()
    const today = getTodayInTimezone(timezone)
    const dateStr = formatDateForDB(today)

    try {
      // First try to get existing record
      const { data: existing, error: selectError } = await this.supabase
        .from('water_intake')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('date', dateStr)
        .single()

      if (existing) {
        return existing
      }

      // Only create if we got a "not found" error (PGRST116)
      if (selectError && selectError.code === 'PGRST116') {
        // If no record exists, create one
        const newIntakeData = {
          challenge_id: challengeId,
          date: dateStr,
          amount: 0,
          goal: 128, // 1 gallon = 128 oz
          unit: 'oz',
          intake_log: []
        }

        const { data: newRecord, error: insertError } = await this.supabase
          .from('water_intake')
          .insert(newIntakeData)
          .select()
          .single()

        if (insertError) {
          // Check if it's a unique constraint error (someone else created it)
          if (insertError.code === '23505') {
            // Try to fetch again
            const { data: retryData } = await this.supabase
              .from('water_intake')
              .select('*')
              .eq('challenge_id', challengeId)
              .eq('date', dateStr)
              .single()
            
            return retryData || null
          }
          
          console.error('Error creating water intake record:', insertError)
          
          // Queue for offline sync
          queueOfflineAction(
            'water_intake',
            'create',
            'water_intake',
            newIntakeData
          )
          
          // Return a temporary object for UI consistency
          return {
            id: crypto.randomUUID(),
            ...newIntakeData
          }
        }

        return newRecord
      }

      // Some other error occurred
      if (selectError) {
        console.error('Error fetching water intake:', selectError)
      }
      
      return null
    } catch (error) {
      console.error('Error getting water intake:', error)
      return null
    }
  }

  // Add water intake
  async addIntake(
    challengeId: string, 
    amount: number, 
    unit: string = 'oz'
  ): Promise<WaterIntakeData | null> {
    const current = await this.getTodayIntake(challengeId)
    if (!current) return null

    const intakeEntry: WaterIntakeEntry = {
      timestamp: new Date().toISOString(),
      amount,
      unit
    }

    // Convert to ounces for consistent storage
    const amountInOz = this.convertToOunces(amount, unit)

    const updateData = {
      amount: current.amount + amountInOz,
      intake_log: [...current.intake_log, intakeEntry]
    }

    try {
      const { data, error } = await this.supabase
        .from('water_intake')
        .update(updateData)
        .eq('id', current.id)
        .select()
        .single()

      if (error) {
        console.error('Error adding water intake:', error)
        
        // Queue for offline sync
        queueOfflineAction(
          'water_intake',
          'update',
          'water_intake',
          { id: current.id, ...updateData }
        )
        
        // Return updated object for UI consistency
        return {
          ...current,
          ...updateData
        }
      }

      // Update daily progress if goal is met
      if (data && data.amount >= data.goal) {
        await this.updateDailyProgress(challengeId, true)
      }

      return data
    } catch (error) {
      console.error('Error updating water intake:', error)
      return null
    }
  }

  // Remove water intake (undo)
  async removeIntake(
    challengeId: string, 
    amount: number, 
    unit: string = 'oz'
  ): Promise<WaterIntakeData | null> {
    const current = await this.getTodayIntake(challengeId)
    if (!current) return null

    const amountInOz = this.convertToOunces(amount, unit)
    const newAmount = Math.max(0, current.amount - amountInOz)
    const updateData = { amount: newAmount }

    try {
      const { data, error } = await this.supabase
        .from('water_intake')
        .update(updateData)
        .eq('id', current.id)
        .select()
        .single()

      if (error) {
        console.error('Error removing water intake:', error)
        
        // Queue for offline sync
        queueOfflineAction(
          'water_intake',
          'update',
          'water_intake',
          { id: current.id, ...updateData }
        )
        
        // Return updated object for UI consistency
        return {
          ...current,
          ...updateData
        }
      }

      // Update daily progress if goal is no longer met
      if (data && data.amount < data.goal && current.amount >= current.goal) {
        await this.updateDailyProgress(challengeId, false)
      }

      return data
    } catch (error) {
      console.error('Error updating water intake:', error)
      return null
    }
  }

  // Get water intake history
  async getIntakeHistory(
    challengeId: string, 
    days: number = 7
  ): Promise<WaterIntakeData[]> {
    const timezone = await getUserTimezone()
    const endDate = getTodayInTimezone(timezone)
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - days)

    try {
      const { data, error } = await this.supabase
        .from('water_intake')
        .select('*')
        .eq('challenge_id', challengeId)
        .gte('date', formatDateForDB(startDate))
        .lte('date', formatDateForDB(endDate))
        .order('date', { ascending: false })

      if (error) {
        console.error('Error fetching water intake history:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error getting intake history:', error)
      return []
    }
  }

  // Update daily water goal
  async updateGoal(
    challengeId: string, 
    goal: number, 
    unit: string = 'oz'
  ): Promise<WaterIntakeData | null> {
    const current = await this.getTodayIntake(challengeId)
    if (!current) return null

    const goalInOz = this.convertToOunces(goal, unit)
    const updateData = { goal: goalInOz }

    try {
      const { data, error } = await this.supabase
        .from('water_intake')
        .update(updateData)
        .eq('id', current.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating water goal:', error)
        
        // Queue for offline sync
        queueOfflineAction(
          'water_intake',
          'update',
          'water_intake',
          { id: current.id, ...updateData }
        )
        
        // Return updated object for UI consistency
        return {
          ...current,
          ...updateData
        }
      }

      return data
    } catch (error) {
      console.error('Error updating goal:', error)
      return null
    }
  }

  // Helper function to convert units to ounces
  private convertToOunces(amount: number, unit: string): number {
    switch (unit) {
      case 'oz':
        return amount
      case 'cups':
        return amount * 8 // 1 cup = 8 oz
      case 'ml':
        return amount * 0.033814 // 1 ml = 0.033814 oz
      case 'liters':
        return amount * 33.814 // 1 liter = 33.814 oz
      default:
        return amount
    }
  }

  // Update daily progress for water intake
  private async updateDailyProgress(challengeId: string, completed: boolean): Promise<void> {
    const timezone = await getUserTimezone()
    const today = getTodayInTimezone(timezone)
    const dateStr = formatDateForDB(today)

    try {
      // Get current daily progress
      const { data: progress } = await this.supabase
        .from('daily_progress')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('date', dateStr)
        .single()

      if (progress) {
        const tasks = progress.tasks || {}
        tasks['water-intake'] = { completed }

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
export const waterIntakeService = WaterIntakeService.getInstance()