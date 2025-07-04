'use client'

import { useState, useEffect, useCallback } from 'react'
import { waterIntakeService } from '@/lib/services/water-intake'
import { toast } from '@/lib/toast'
import { taskHelpers } from '@/lib/services/task-completion'

interface WaterIntakeData {
  amount: number
  goal: number
  unit: string
  percentage: number
  isGoalMet: boolean
}

interface UseWaterIntakeOptions {
  challengeId: string
  onGoalMet?: () => void
}

export function useWaterIntake({ challengeId, onGoalMet }: UseWaterIntakeOptions) {
  const [data, setData] = useState<WaterIntakeData>({
    amount: 0,
    goal: 128,
    unit: 'oz',
    percentage: 0,
    isGoalMet: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Load today's intake
  const loadIntake = useCallback(async () => {
    setIsLoading(true)
    try {
      const intake = await waterIntakeService.getTodayIntake(challengeId)
      if (intake) {
        const percentage = Math.min(100, (intake.amount / intake.goal) * 100)
        const isGoalMet = intake.amount >= intake.goal
        
        setData(prev => {
          // Trigger callback if goal just met
          if (isGoalMet && !prev.isGoalMet) {
            onGoalMet?.()
          }
          
          return {
            amount: intake.amount,
            goal: intake.goal,
            unit: intake.unit,
            percentage,
            isGoalMet
          }
        })
      }
    } catch (error) {
      console.error('Error loading water intake:', error)
      toast.error('Failed to load water intake')
    } finally {
      setIsLoading(false)
    }
  }, [challengeId, onGoalMet])

  // Add water
  const addWater = useCallback(async (amount: number, unit: string = 'oz') => {
    setIsSaving(true)
    try {
      const result = await waterIntakeService.addIntake(challengeId, amount, unit)
      if (result) {
        const percentage = Math.min(100, (result.amount / result.goal) * 100)
        const isGoalMet = result.amount >= result.goal
        
        setData({
          amount: result.amount,
          goal: result.goal,
          unit: result.unit,
          percentage,
          isGoalMet
        })

        // Show toast and handle task completion
        const remaining = Math.max(0, result.goal - result.amount)
        if (isGoalMet && !data.isGoalMet) {
          // Auto-complete the water intake task
          try {
            const taskCompleted = await taskHelpers.completeWaterIntake()
            if (taskCompleted) {
              toast.success('Goal Achieved & Task Completed!', 'You reached your daily water intake goal and your task has been automatically marked as complete! 💧')
            } else {
              toast.success('Goal Achieved!', 'You reached your daily water intake goal! 💧')
            }
          } catch (error) {
            console.error('Error auto-completing water intake task:', error)
            toast.success('Goal Achieved!', 'You reached your daily water intake goal! 💧')
          }
          onGoalMet?.()
        } else if (remaining > 0) {
          toast.success('Water Added', `${remaining} oz remaining`)
        }
      }
    } catch (error) {
      console.error('Error adding water:', error)
      toast.error('Failed to add water')
    } finally {
      setIsSaving(false)
    }
  }, [challengeId, data.isGoalMet, onGoalMet])

  // Remove water
  const removeWater = useCallback(async (amount: number, unit: string = 'oz') => {
    setIsSaving(true)
    try {
      const result = await waterIntakeService.removeIntake(challengeId, amount, unit)
      if (result) {
        const percentage = Math.min(100, (result.amount / result.goal) * 100)
        const isGoalMet = result.amount >= result.goal
        
        setData({
          amount: result.amount,
          goal: result.goal,
          unit: result.unit,
          percentage,
          isGoalMet
        })

        toast.info('Water Removed', `Current: ${result.amount} oz`)
      }
    } catch (error) {
      console.error('Error removing water:', error)
      toast.error('Failed to remove water')
    } finally {
      setIsSaving(false)
    }
  }, [challengeId])

  // Quick add presets
  const quickAdd = useCallback(async (preset: 'glass' | 'bottle' | 'cup') => {
    const amounts = {
      glass: 8,  // 8 oz
      bottle: 16, // 16 oz
      cup: 12    // 12 oz
    }
    
    await addWater(amounts[preset], 'oz')
  }, [addWater])

  // Update goal
  const updateGoal = useCallback(async (newGoal: number, unit: string = 'oz') => {
    setIsSaving(true)
    try {
      const result = await waterIntakeService.updateGoal(challengeId, newGoal, unit)
      if (result) {
        const percentage = Math.min(100, (result.amount / result.goal) * 100)
        const isGoalMet = result.amount >= result.goal
        
        setData({
          amount: result.amount,
          goal: result.goal,
          unit: result.unit,
          percentage,
          isGoalMet
        })

        toast.success('Goal Updated', `New goal: ${result.goal} oz`)
      }
    } catch (error) {
      console.error('Error updating goal:', error)
      toast.error('Failed to update goal')
    } finally {
      setIsSaving(false)
    }
  }, [challengeId])

  // Load initial data
  useEffect(() => {
    loadIntake()
  }, [challengeId]) // Only depend on challengeId, not loadIntake

  // Set up notification reminders
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      // Set up hourly reminders during waking hours (8 AM - 8 PM)
      const now = new Date()
      const currentHour = now.getHours()
      
      if (currentHour >= 8 && currentHour < 20 && !data.isGoalMet) {
        const checkInterval = setInterval(() => {
          const hour = new Date().getHours()
          if (hour >= 8 && hour < 20 && !data.isGoalMet) {
            const remaining = data.goal - data.amount
            if (remaining > 0) {
              new Notification('75 Hard Water Reminder', {
                body: `${remaining} oz left to drink today! 💧`,
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png'
              })
            }
          }
        }, 3600000) // Every hour

        return () => clearInterval(checkInterval)
      }
    }
  }, [data.isGoalMet, data.goal, data.amount])

  return {
    // State
    amount: data.amount,
    goal: data.goal,
    unit: data.unit,
    percentage: data.percentage,
    isGoalMet: data.isGoalMet,
    isLoading,
    isSaving,
    
    // Actions
    addWater,
    removeWater,
    quickAdd,
    updateGoal,
    refresh: loadIntake
  }
}