'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useChallenge } from '@/contexts/challenge-context'
import { progressAggregationService, type DailyProgressAggregation } from '@/lib/services/progress-aggregation'
import { dailyProgressService } from '@/lib/services/daily-progress'
import { toast } from '@/lib/toast'
import { getCurrentDayNumber } from '@/lib/calendar-utils'

interface UseDailyProgressOptions {
  date?: Date
  onComplete?: () => void
}

export function useDailyProgress({
  date = new Date(),
  onComplete
}: UseDailyProgressOptions = {}) {
  const { currentChallenge } = useChallenge()
  const [aggregation, setAggregation] = useState<DailyProgressAggregation | null>(null)
  const [loading, setLoading] = useState(true)
  const [celebrationShown, setCelebrationShown] = useState(false)
  const loadingRef = useRef(false)

  // Load aggregation data
  const loadAggregation = useCallback(async () => {
    if (!currentChallenge || loadingRef.current) return

    loadingRef.current = true
    try {
      const data = await progressAggregationService.getDailyAggregation(
        currentChallenge.id,
        date
      )
      setAggregation(data)

      // Check if we should trigger completion callback
      if (data.isComplete && !celebrationShown) {
        // Only trigger if completed today
        const today = new Date()
        const isToday = date.toDateString() === today.toDateString()
        
        if (isToday) {
          setCelebrationShown(true)
          onComplete?.()
        }
      }
    } catch (error) {
      console.error('Error loading daily progress:', error)
      toast.error('Error loading progress')
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [currentChallenge, date, celebrationShown, onComplete])

  useEffect(() => {
    loadAggregation()
  }, [loadAggregation])

  // Subscribe to real-time updates - disabled for now to prevent loops
  // useEffect(() => {
  //   if (!currentChallenge) return

  //   let timeoutId: NodeJS.Timeout
  //   const unsubscribe = dailyProgressService.subscribeToUpdates(
  //     currentChallenge.id,
  //     () => {
  //       // Debounce the reload to prevent rapid updates
  //       clearTimeout(timeoutId)
  //       timeoutId = setTimeout(() => {
  //         loadAggregation()
  //       }, 1000)
  //     }
  //   )

  //   return () => {
  //     clearTimeout(timeoutId)
  //     unsubscribe()
  //   }
  // }, [currentChallenge, loadAggregation])

  // Update task completion
  const updateTask = useCallback(async (
    taskType: 'reading' | 'diet',
    completed: boolean
  ) => {
    if (!currentChallenge) return

    try {
      await progressAggregationService.updateFromComponent(
        currentChallenge.id,
        date,
        taskType,
        { completed }
      )
      
      // Reload aggregation
      await loadAggregation()
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }, [currentChallenge, date, loadAggregation])

  // Calculate current day number using the same logic as calendar utils
  const currentDay = currentChallenge 
    ? getCurrentDayNumber(new Date(currentChallenge.start_date))
    : 1

  return {
    aggregation,
    loading,
    updateTask,
    reload: loadAggregation,
    currentDay
  }
}