'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from '@/lib/toast'
import { requestWakeLock, releaseWakeLock, startSilentAudio, stopSilentAudio } from '@/lib/utils/wake-lock'

interface WalkTimerState {
  seconds: number
  isRunning: boolean
  isPaused: boolean
  startTime: number | null
  pausedTime: number
  distance: number
  distanceUnit: 'miles' | 'km'
}

interface UseWalkTimerOptions {
  onComplete?: (duration: number, distance: number, unit: 'miles' | 'km') => void
  onTick?: (seconds: number) => void
}

export function useWalkTimer({
  onComplete,
  onTick
}: UseWalkTimerOptions = {}) {
  const [state, setState] = useState<WalkTimerState>({
    seconds: 0,
    isRunning: false,
    isPaused: false,
    startTime: null,
    pausedTime: 0,
    distance: 0,
    distanceUnit: 'miles'
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastActiveTime = useRef<number>(Date.now())
  const totalElapsedRef = useRef<number>(0)

  // Handle visibility changes
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

          // Show milestone notifications
          if (newSeconds === 900) { // 15 minutes
            showNotification('15 minutes of walking! Keep it up! 🚶')
          } else if (newSeconds === 1800) { // 30 minutes
            showNotification('30 minutes done! Great progress! 🏃')
          } else if (newSeconds === 2700) { // 45 minutes
            showNotification('45 minutes complete! You got this! 💪')
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
  }, [state.isRunning, state.isPaused, onTick])

  // Show notification
  const showNotification = useCallback((message: string) => {
    // Browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('75 Hard Walk Timer', {
        body: message,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [200, 100, 200]
      })
    }

    // Also show toast
    toast.success('Walk Update', message)
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
    setState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      startTime: prev.startTime || Date.now(),
      seconds: prev.seconds // Keep existing seconds if resuming
    }))

    // Request notification permission on first start
    requestNotificationPermission()
    
    // Try to keep screen awake
    await requestWakeLock()
    
    // Start silent audio to keep app active on iOS
    startSilentAudio()
    
    // Update tracking references
    lastActiveTime.current = Date.now()
    totalElapsedRef.current = state.seconds

    // Save to localStorage for persistence
    localStorage.setItem('walk_timer_state', JSON.stringify({
      startTime: Date.now(),
      seconds: state.seconds,
      isRunning: true,
      distance: state.distance,
      distanceUnit: state.distanceUnit
    }))
  }, [state.seconds, state.distance, state.distanceUnit, requestNotificationPermission])

  // Pause timer
  const pause = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPaused: true,
      pausedTime: Date.now()
    }))

    // Update localStorage
    const savedState = {
      startTime: state.startTime,
      seconds: state.seconds,
      isRunning: true,
      isPaused: true,
      pausedTime: Date.now(),
      distance: state.distance,
      distanceUnit: state.distanceUnit
    }
    localStorage.setItem('walk_timer_state', JSON.stringify(savedState))
  }, [state])

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

    // Update localStorage
    const savedState = {
      startTime: state.startTime,
      seconds: state.seconds,
      isRunning: true,
      isPaused: false,
      distance: state.distance,
      distanceUnit: state.distanceUnit
    }
    localStorage.setItem('walk_timer_state', JSON.stringify(savedState))
  }, [state])

  // Stop/Reset timer
  const stop = useCallback(async () => {
    setState({
      seconds: 0,
      isRunning: false,
      isPaused: false,
      startTime: null,
      pausedTime: 0,
      distance: state.distance, // Keep distance for manual entry
      distanceUnit: state.distanceUnit
    })

    // Clear localStorage
    localStorage.removeItem('walk_timer_state')
    
    // Release wake lock and stop audio
    await releaseWakeLock()
    stopSilentAudio()
  }, [state.distance, state.distanceUnit])

  // Complete walk
  const complete = useCallback(() => {
    const duration = state.seconds
    const distance = state.distance
    const unit = state.distanceUnit
    
    // Validate minimum duration (45 minutes)
    if (duration < 2700) {
      toast.error('Walk Too Short', 'Your outdoor walk must be at least 45 minutes')
      return false
    }

    // Show completion notification
    showNotification(`Walk complete! Duration: ${formatTime(duration)}, Distance: ${distance} ${unit} 🎉`)
    
    // Call completion callback
    onComplete?.(duration, distance, unit)

    // Reset timer
    stop()
    return true
  }, [state, onComplete, showNotification, stop])

  // Update distance
  const setDistance = useCallback((distance: number) => {
    setState(prev => ({ ...prev, distance }))
    
    // Update localStorage if timer is running
    if (state.isRunning) {
      const savedState = localStorage.getItem('walk_timer_state')
      if (savedState) {
        const parsed = JSON.parse(savedState)
        localStorage.setItem('walk_timer_state', JSON.stringify({
          ...parsed,
          distance
        }))
      }
    }
  }, [state.isRunning])

  // Update distance unit
  const setDistanceUnit = useCallback((distanceUnit: 'miles' | 'km') => {
    setState(prev => ({ ...prev, distanceUnit }))
    
    // Update localStorage if timer is running
    if (state.isRunning) {
      const savedState = localStorage.getItem('walk_timer_state')
      if (savedState) {
        const parsed = JSON.parse(savedState)
        localStorage.setItem('walk_timer_state', JSON.stringify({
          ...parsed,
          distanceUnit
        }))
      }
    }
  }, [state.isRunning])

  // Restore timer state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('walk_timer_state')
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
            pausedTime: parsed.pausedTime || 0,
            distance: parsed.distance || 0,
            distanceUnit: parsed.distanceUnit || 'miles'
          })

          toast.info('Timer restored', 'Your walk timer has been restored')
        } else {
          // Clear old timer state
          localStorage.removeItem('walk_timer_state')
        }
      } catch (error) {
        console.error('Error restoring timer state:', error)
        localStorage.removeItem('walk_timer_state')
      }
    }
  }, [])

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

  // Calculate pace
  const calculatePace = (): string => {
    if (state.distance === 0 || state.seconds === 0) return '--:--'
    
    const minutesPerUnit = state.seconds / 60 / state.distance
    const paceMinutes = Math.floor(minutesPerUnit)
    const paceSeconds = Math.round((minutesPerUnit - paceMinutes) * 60)
    
    return `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}`
  }

  return {
    // State
    seconds: state.seconds,
    isRunning: state.isRunning,
    isPaused: state.isPaused,
    distance: state.distance,
    distanceUnit: state.distanceUnit,
    formattedTime: formatTime(state.seconds),
    pace: calculatePace(),

    // Actions
    start,
    pause,
    resume,
    stop,
    complete,
    setDistance,
    setDistanceUnit,

    // Helpers
    formatTime
  }
}