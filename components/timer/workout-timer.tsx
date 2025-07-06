'use client'

import { useState } from 'react'
import { useWorkoutTimer } from '@/hooks/use-workout-timer'
import { Button } from '@/components/ui/button'
import { Play, Pause, Square, CheckCircle2, Timer } from 'lucide-react'
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

  const progress = targetDuration ? (seconds / targetDuration) * 100 : 0

  return (
    <div className={cn('w-full bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm', className)}>
      <div className="space-y-6">
        {/* Timer Display */}
        <div className="text-center">
          <div className="text-6xl font-mono font-bold mb-2">
            {formattedTime}
          </div>
          {targetDuration && (
            <div className="text-sm text-muted-foreground">
              Target: {formatDuration(targetDuration)}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {targetDuration && (
          <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-primary transition-all duration-1000 ease-linear"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}

        {/* Preset Buttons */}
        {!isRunning && (
          <div className="flex gap-2 justify-center">
            {PRESET_DURATIONS.map((preset) => (
              <Button
                key={preset.seconds}
                variant={targetDuration === preset.seconds ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetClick(preset.seconds)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2 justify-center">
          {!isRunning ? (
            <Button
              size="lg"
              onClick={handleStart}
              className="min-w-[120px]"
            >
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
          ) : (
            <>
              {isPaused ? (
                <Button
                  size="lg"
                  onClick={resume}
                  className="min-w-[120px]"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={pause}
                  className="min-w-[120px]"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              <Button
                size="lg"
                variant="destructive"
                onClick={handleStop}
                aria-label="Stop workout"
              >
                <Square className="h-4 w-4" />
              </Button>
              {seconds >= 300 && ( // Show complete button after 5 minutes
                <Button
                  size="lg"
                  variant="default"
                  onClick={handleComplete}
                  className={cn(
                    seconds >= 2700 
                      ? "bg-green-600 hover:bg-green-700 animate-pulse" 
                      : "bg-green-600 hover:bg-green-700"
                  )}
                  aria-label="Complete workout"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {seconds >= 2700 && <span className="ml-2">Complete</span>}
                </Button>
              )}
            </>
          )}
        </div>

        {/* Timer Status */}
        {isRunning && (
          <div className="text-center text-sm text-muted-foreground">
            {isPaused ? 'Timer paused' : 'Timer running...'}
            {targetDuration && progress >= 100 && (
              <div className="text-green-600 font-medium mt-1">
                Target reached! Keep going or complete your workout.
              </div>
            )}
            {!targetDuration && seconds >= 2700 && (
              <div className="text-green-600 font-medium mt-1">
                45 minutes reached! Your workout is ready to complete.
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