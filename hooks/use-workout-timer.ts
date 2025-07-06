'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from '@/lib/toast'
import { requestWakeLock, releaseWakeLock, startSilentAudio, stopSilentAudio } from '@/lib/utils/wake-lock'

interface TimerState {
  seconds: number
  isRunning: boolean
  isPaused: boolean
  startTime: number | null
  pausedTime: number
}

interface UseWorkoutTimerOptions {
  onComplete?: (duration: number) => void
  onTick?: (seconds: number) => void
  targetDuration?: number // in seconds
}

export function useWorkoutTimer({
  onComplete,
  onTick,
  targetDuration
}: UseWorkoutTimerOptions = {}) {
  const [state, setState] = useState<TimerState>({
    seconds: 0,
    isRunning: false,
    isPaused: false,
    startTime: null,
    pausedTime: 0
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastActiveTime = useRef<number>(Date.now())
  const totalElapsedRef = useRef<number>(0)
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const serviceWorkerRef = useRef<ServiceWorker | null>(null)
  const hasPrompted45Min = useRef(false)

  // Handle visibility changes and cleanup
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && state.isRunning && !state.isPaused) {
        // App is going to background - save current state
        lastActiveTime.current = Date.now()
        totalElapsedRef.current = state.seconds
      } else if (!document.hidden && state.isRunning && !state.isPaused) {
        // App is coming back to foreground - calculate elapsed time
        const elapsed = Math.floor((Date.now() - lastActiveTime.current) / 1000)
        setState(prev => ({
          ...prev,
          seconds: totalElapsedRef.current + elapsed
        }))
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [state.isRunning, state.isPaused, state.seconds])
  
  // Cleanup on unmount only
  useEffect(() => {
    const isRunningRef = { current: false };
    
    // Update ref when state changes
    isRunningRef.current = state.isRunning;
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current)
      }
      // Only release wake lock if timer was not running when component unmounts
      if (!isRunningRef.current) {
        releaseWakeLock()
        stopSilentAudio()
      }
    }
  }, [state.isRunning])

  // Timer tick effect
  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      intervalRef.current = setInterval(() => {
        setState(prev => {
          const newSeconds = prev.seconds + 1
          
          // Call onTick callback
          onTick?.(newSeconds)

          // Check if target duration reached
          if (targetDuration && newSeconds >= targetDuration) {
            // Auto-complete when target reached
            handleComplete()
          }

          // Show notifications at milestones
          if (newSeconds === 900) { // 15 minutes
            showNotification('15 minutes completed! Keep going! 💪')
          } else if (newSeconds === 1800) { // 30 minutes
            showNotification('30 minutes done! You\'re crushing it! 🔥')
          } else if (newSeconds === 2700) { // 45 minutes
            showNotification('45 minutes complete! You can now complete your workout! 🎯')
          }

          return { ...prev, seconds: newSeconds }
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [state.isRunning, state.isPaused, targetDuration, onTick])

  // Show notification
  const showNotification = useCallback((message: string) => {
    // Browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('75 Hard Timer', {
        body: message,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [200, 100, 200]
      })
    }

    // Also show toast
    toast.success('Timer Update', message)
  }, [])

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        toast.success('Notifications enabled!')
      }
    }
  }, [])

  // Start timer
  const start = useCallback(async () => {
    const newState = {
      isRunning: true,
      isPaused: false,
      startTime: state.startTime || Date.now(),
      seconds: state.seconds // Keep existing seconds if resuming
    }

    setState(prev => ({ ...prev, ...newState }))

    // Request notification permission on first start
    requestNotificationPermission()
    
    // Try to keep screen awake
    await requestWakeLock()
    
    // Start silent audio to keep app active on iOS
    startSilentAudio()
    
    // Update tracking references
    lastActiveTime.current = Date.now()
    totalElapsedRef.current = state.seconds

    // Notify service worker
    if (serviceWorkerRef.current) {
      serviceWorkerRef.current.postMessage({
        type: 'START_TIMER',
        data: { seconds: state.seconds }
      })
    }

    // Save to localStorage for persistence
    localStorage.setItem('workout_timer_state', JSON.stringify({
      startTime: newState.startTime,
      seconds: state.seconds,
      isRunning: true
    }))
  }, [state.seconds, state.startTime, requestNotificationPermission])

  // Pause timer
  const pause = useCallback(() => {
    const pausedTime = Date.now()
    
    setState(prev => ({
      ...prev,
      isPaused: true,
      pausedTime
    }))

    // Notify service worker
    if (serviceWorkerRef.current) {
      serviceWorkerRef.current.postMessage({ type: 'PAUSE_TIMER' })
    }

    // Update localStorage
    const savedState = {
      startTime: state.startTime,
      seconds: state.seconds,
      isRunning: true,
      isPaused: true,
      pausedTime
    }
    localStorage.setItem('workout_timer_state', JSON.stringify(savedState))
  }, [state.startTime, state.seconds])

  // Resume timer
  const resume = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isPaused: false
    }))
    
    // Re-acquire wake lock and restart audio
    await requestWakeLock()
    startSilentAudio()
    
    // Update tracking references
    lastActiveTime.current = Date.now()
    totalElapsedRef.current = state.seconds

    // Notify service worker
    if (serviceWorkerRef.current) {
      serviceWorkerRef.current.postMessage({ type: 'RESUME_TIMER' })
    }

    // Update localStorage
    const savedState = {
      startTime: state.startTime,
      seconds: state.seconds,
      isRunning: true,
      isPaused: false
    }
    localStorage.setItem('workout_timer_state', JSON.stringify(savedState))
  }, [state.startTime, state.seconds])

  // Stop/Reset timer
  const stop = useCallback(async () => {
    setState({
      seconds: 0,
      isRunning: false,
      isPaused: false,
      startTime: null,
      pausedTime: 0
    })

    // Notify service worker
    if (serviceWorkerRef.current) {
      serviceWorkerRef.current.postMessage({ type: 'STOP_TIMER' })
    }

    // Clear localStorage
    localStorage.removeItem('workout_timer_state')
    
    // Release wake lock and stop audio
    await releaseWakeLock()
    stopSilentAudio()
  }, [])

  // Complete workout
  const handleComplete = useCallback(() => {
    const duration = state.seconds
    
    // Show completion notification
    showNotification(`Workout complete! Duration: ${formatTime(duration)} 🎉`)
    
    // Call completion callback
    onComplete?.(duration)

    // Reset timer
    stop()
  }, [state.seconds, onComplete, showNotification, stop])

  // Initialize service worker communication
  useEffect(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      serviceWorkerRef.current = navigator.serviceWorker.controller

      // Listen for timer updates from service worker
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'TIMER_UPDATE') {
          const swState = event.data.data
          setState({
            seconds: swState.seconds || 0,
            isRunning: swState.isRunning || false,
            isPaused: swState.isPaused || false,
            startTime: swState.startTime || null,
            pausedTime: swState.pausedTime || 0
          })
        }
      }

      navigator.serviceWorker.addEventListener('message', handleMessage)

      // Request current timer state from service worker
      serviceWorkerRef.current.postMessage({ type: 'GET_TIMER_STATE' })

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage)
      }
    }
  }, [])

  // Restore timer state from localStorage (fallback)
  useEffect(() => {
    // Only restore from localStorage if no service worker is available
    if (!serviceWorkerRef.current) {
      const savedState = localStorage.getItem('workout_timer_state')
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState)
          const now = Date.now()
          const elapsed = Math.floor((now - parsed.startTime) / 1000)
          
          // Only restore if timer was running and less than 3 hours elapsed
          if (parsed.isRunning && elapsed < 10800) {
            setState({
              seconds: parsed.seconds + (parsed.isPaused ? 0 : elapsed),
              isRunning: parsed.isRunning,
              isPaused: parsed.isPaused || false,
              startTime: parsed.startTime,
              pausedTime: parsed.pausedTime || 0
            })

            toast.info('Timer restored', 'Your workout timer has been restored')
          } else {
            // Clear old timer state
            localStorage.removeItem('workout_timer_state')
          }
        } catch (error) {
          console.error('Error restoring timer state:', error)
          localStorage.removeItem('workout_timer_state')
        }
      }
    }
  }, [])

  // Auto-prompt at 45 minutes if no target set
  useEffect(() => {
    if (state.seconds >= 2700 && state.isRunning && !state.isPaused && !hasPrompted45Min.current) {
      // Only prompt if no target duration set or target is greater than 45 minutes
      if (!targetDuration || targetDuration > 2700) {
        hasPrompted45Min.current = true
        
        // Give user a moment to see the notification
        setTimeout(() => {
          if (state.isRunning && !state.isPaused && state.seconds >= 2700) {
            if (confirm('You\'ve reached 45 minutes! Would you like to complete this workout?')) {
              handleComplete()
            }
          }
        }, 2000)
      }
    }
    
    // Reset prompt flag if timer is stopped
    if (!state.isRunning) {
      hasPrompted45Min.current = false
    }
  }, [state.seconds, state.isRunning, state.isPaused, targetDuration, handleComplete])

  // Format time helper
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return {
    // State
    seconds: state.seconds,
    isRunning: state.isRunning,
    isPaused: state.isPaused,
    formattedTime: formatTime(state.seconds),

    // Actions
    start,
    pause,
    resume,
    stop,
    complete: handleComplete,

    // Helpers
    formatTime
  }
}