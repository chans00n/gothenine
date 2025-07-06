'use client'

import { useState } from 'react'
import { useWalkTimer } from '@/hooks/use-walk-timer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Play, Pause, Square, CheckCircle2, Footprints, MapPin } from 'lucide-react'
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

  const progress = (seconds / 2700) * 100 // 45 minutes minimum

  return (
    <div className={cn('w-full bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm', className)}>
      <div className="space-y-6">
        {/* Timer Display */}
        <div className="text-center">
          <div className="text-6xl font-mono font-bold mb-2">
            {formattedTime}
          </div>
          <div className="text-sm text-muted-foreground">
            Minimum: 45 minutes
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className={cn(
              "absolute inset-y-0 left-0 transition-all duration-1000 ease-linear",
              progress >= 100 ? "bg-green-600" : "bg-primary"
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Distance Input */}
        {showDistanceInput && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4" />
              Track Your Distance
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="distance" className="sr-only">Distance</Label>
                <Input
                  id="distance"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  value={distance || ''}
                  onChange={(e) => handleDistanceChange(e.target.value)}
                  className="text-lg"
                />
              </div>
              
              <RadioGroup 
                value={distanceUnit} 
                onValueChange={(value) => setDistanceUnit(value as 'miles' | 'km')}
                className="flex gap-2"
              >
                <div className="flex items-center">
                  <RadioGroupItem value="miles" id="miles" className="sr-only" />
                  <Label 
                    htmlFor="miles" 
                    className={cn(
                      "px-3 py-2 rounded cursor-pointer transition-colors",
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
                      "px-3 py-2 rounded cursor-pointer transition-colors",
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

            {distance > 0 && seconds > 0 && (
              <div className="text-sm text-muted-foreground">
                Pace: {pace} per {distanceUnit === 'miles' ? 'mile' : 'km'}
              </div>
            )}
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
              Start Walk
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
                aria-label="Stop walk"
              >
                <Square className="h-4 w-4" />
              </Button>
              {seconds >= 2700 && ( // Show complete button after 45 minutes
                <Button
                  size="lg"
                  variant="default"
                  onClick={handleComplete}
                  className="bg-green-600 hover:bg-green-700"
                  aria-label="Complete walk"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>

        {/* Timer Status */}
        {isRunning && (
          <div className="text-center text-sm text-muted-foreground">
            {isPaused ? 'Timer paused' : 'Timer running...'}
            {progress >= 100 && (
              <div className="text-green-600 font-medium mt-1">
                Minimum time reached! Enter your distance and complete when ready.
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