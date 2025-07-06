'use client'

import { useState } from 'react'
import { useWorkoutTimer } from '@/hooks/use-workout-timer'
import { Button } from '@/components/ui/button'
import { Play, Pause, Square, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'

interface WorkoutTimerProps {
  onComplete?: (duration: number) => void
  className?: string
}

const PRESET_DURATIONS = [
  { label: '30 min', seconds: 1800 },
  { label: '45 min', seconds: 2700 },
  { label: '60 min', seconds: 3600 },
]

export function WorkoutTimer({ onComplete, className }: WorkoutTimerProps) {
  const [targetDuration, setTargetDuration] = useState<number | undefined>()
  
  const {
    seconds,
    isRunning,
    isPaused,
    formattedTime,
    start,
    pause,
    resume,
    stop,
    complete
  } = useWorkoutTimer({
    onComplete: (duration) => {
      onComplete?.(duration)
      toast.success('Workout Complete!', `Great job! You worked out for ${formatDuration(duration)}`)
    },
    targetDuration
  })

  const handlePresetClick = (presetSeconds: number) => {
    if (!isRunning) {
      setTargetDuration(presetSeconds)
      toast.info('Timer Set', `Target duration: ${formatDuration(presetSeconds)}`)
    }
  }

  const handleStart = () => {
    start()
  }

  const handleStop = () => {
    if (confirm('Are you sure you want to stop the timer? Progress will be lost.')) {
      stop()
      setTargetDuration(undefined)
    }
  }

  const handleComplete = () => {
    if (confirm('Mark this workout as complete?')) {
      complete()
      setTargetDuration(undefined)
    }
  }

  // Calculate progress for circular indicator
  const progress = Math.min((seconds / 2700) * 100, 100) // 45 min goal
  const circumference = 2 * Math.PI * 120 // radius of 120
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className={cn('w-full', className)}>
      <div className="space-y-8">
        {/* Circular Timer Display */}
        <div className="relative mx-auto w-80 h-80 md:w-96 md:h-96">
          {/* Background circle */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 250 250">
            <circle
              cx="125"
              cy="125"
              r="120"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted-foreground/20"
            />
            {/* Progress circle */}
            <circle
              cx="125"
              cy="125"
              r="120"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className={cn(
                "transition-all duration-1000 ease-linear",
                seconds >= 2700 ? "text-green-500" : "text-primary"
              )}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset
              }}
            />
          </svg>
          
          {/* Timer content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-7xl md:text-8xl font-mono font-bold tracking-tight">
                {formattedTime}
              </div>
              {targetDuration && (
                <div className="text-sm text-muted-foreground">
                  Target: {formatDuration(targetDuration)}
                </div>
              )}
              {!targetDuration && (
                <div className="text-sm text-muted-foreground">
                  Goal: 45 minutes
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preset Buttons - Only show when not running */}
        {!isRunning && (
          <div className="flex gap-3 justify-center">
            {PRESET_DURATIONS.map((preset) => (
              <Button
                key={preset.seconds}
                variant={targetDuration === preset.seconds ? "default" : "outline"}
                size="default"
                onClick={() => handlePresetClick(preset.seconds)}
                className="min-w-[80px]"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {!isRunning ? (
            <Button
              size="lg"
              onClick={handleStart}
              className="w-full sm:w-auto min-w-[200px] h-14 text-lg font-semibold"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Workout
            </Button>
          ) : (
            <div className="flex gap-3 w-full sm:w-auto">
              {/* Main action button (Pause/Resume) */}
              {isPaused ? (
                <Button
                  size="lg"
                  onClick={resume}
                  className="flex-1 sm:flex-initial min-w-[140px] h-14 text-lg font-semibold"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Resume
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={pause}
                  className="flex-1 sm:flex-initial min-w-[140px] h-14 text-lg font-semibold"
                >
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </Button>
              )}
              
              {/* Stop button */}
              <Button
                size="lg"
                variant="destructive"
                onClick={handleStop}
                className="h-14 px-5"
                aria-label="Stop workout"
              >
                <Square className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Complete button - separate row when visible */}
        {isRunning && seconds >= 300 && (
          <div className="flex justify-center">
            <Button
              size="lg"
              variant="default"
              onClick={handleComplete}
              className={cn(
                "min-w-[200px] h-14 text-lg font-semibold",
                seconds >= 2700 
                  ? "bg-green-600 hover:bg-green-700 animate-pulse" 
                  : "bg-green-600 hover:bg-green-700"
              )}
              aria-label="Complete workout"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              {seconds >= 2700 ? "Complete Workout" : "Finish Early"}
            </Button>
          </div>
        )}

        {/* Timer Status */}
        {isRunning && (
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">
              {isPaused ? 'Timer paused' : 'Timer running...'}
            </div>
            {targetDuration && progress >= 100 && (
              <div className="text-green-600 dark:text-green-400 font-medium">
                Target reached! Keep going or complete your workout.
              </div>
            )}
            {!targetDuration && seconds >= 2700 && (
              <div className="text-green-600 dark:text-green-400 font-medium animate-pulse">
                🎯 45 minutes reached! Your workout is ready to complete.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes} minutes`
}