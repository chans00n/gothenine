'use client'

import { useState } from 'react'
import { useWalkTimer } from '@/hooks/use-walk-timer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Play, Pause, Square, CheckCircle2, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'

interface WalkTimerProps {
  onComplete?: (duration: number, distance: number, unit: 'miles' | 'km') => void
  className?: string
}

export function WalkTimer({ onComplete, className }: WalkTimerProps) {
  const [showDistanceInput, setShowDistanceInput] = useState(false)
  
  const {
    seconds,
    isRunning,
    isPaused,
    distance,
    distanceUnit,
    formattedTime,
    pace,
    start,
    pause,
    resume,
    stop,
    complete,
    setDistance,
    setDistanceUnit
  } = useWalkTimer({
    onComplete: (duration, distance, unit) => {
      onComplete?.(duration, distance, unit)
      toast.success('Walk Complete!', `Great job! You walked for ${formatDuration(duration)} and covered ${distance} ${unit}`)
    }
  })

  const handleStart = () => {
    start()
    setShowDistanceInput(true)
  }

  const handleStop = () => {
    if (confirm('Are you sure you want to stop the timer? Progress will be lost.')) {
      stop()
      setShowDistanceInput(false)
    }
  }

  const handleComplete = () => {
    if (distance === 0) {
      toast.error('Distance Required', 'Please enter the distance you walked')
      return
    }
    
    if (confirm(`Complete this walk?\n\nDuration: ${formattedTime}\nDistance: ${distance} ${distanceUnit}`)) {
      const success = complete()
      if (success) {
        setShowDistanceInput(false)
      }
    }
  }

  const handleDistanceChange = (value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setDistance(numValue)
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
                progress >= 100 ? "text-green-500" : "text-primary"
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
              <div className="text-sm text-muted-foreground">
                Goal: 45 minutes
              </div>
              {distance > 0 && seconds > 0 && (
                <div className="text-lg font-medium">
                  {pace} per {distanceUnit === 'miles' ? 'mile' : 'km'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Distance Input - Show when timer is active */}
        {showDistanceInput && (
          <div className="max-w-sm mx-auto space-y-3">
            <div className="flex items-center justify-center gap-2 text-base font-medium">
              <MapPin className="h-5 w-5" />
              Track Your Distance
            </div>
            
            <div className="flex gap-2">
              <Input
                id="distance"
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                value={distance || ''}
                onChange={(e) => handleDistanceChange(e.target.value)}
                className="text-2xl font-bold text-center h-14"
              />
              
              <RadioGroup 
                value={distanceUnit} 
                onValueChange={(value) => setDistanceUnit(value as 'miles' | 'km')}
                className="flex gap-1"
              >
                <div className="flex items-center">
                  <RadioGroupItem value="miles" id="miles" className="sr-only" />
                  <Label 
                    htmlFor="miles" 
                    className={cn(
                      "px-4 py-3 rounded-lg cursor-pointer transition-colors text-lg font-medium",
                      distanceUnit === 'miles' 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    mi
                  </Label>
                </div>
                <div className="flex items-center">
                  <RadioGroupItem value="km" id="km" className="sr-only" />
                  <Label 
                    htmlFor="km" 
                    className={cn(
                      "px-4 py-3 rounded-lg cursor-pointer transition-colors text-lg font-medium",
                      distanceUnit === 'km' 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    km
                  </Label>
                </div>
              </RadioGroup>
            </div>
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
              Start Walk
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
                aria-label="Stop walk"
              >
                <Square className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Complete button - separate row when visible */}
        {isRunning && seconds >= 2700 && (
          <div className="flex justify-center">
            <Button
              size="lg"
              variant="default"
              onClick={handleComplete}
              className="bg-green-600 hover:bg-green-700 animate-pulse min-w-[200px] h-14 text-lg font-semibold"
              aria-label="Complete walk"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Complete Walk
            </Button>
          </div>
        )}

        {/* Timer Status */}
        {isRunning && (
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">
              {isPaused ? 'Timer paused' : 'Timer running...'}
            </div>
            {progress >= 100 && (
              <div className="text-green-600 dark:text-green-400 font-medium animate-pulse">
                🎯 45 minutes reached! Enter your distance and complete when ready.
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