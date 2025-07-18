'use client'

import { WorkoutTimer } from '@/components/timer/workout-timer'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { workoutHistoryService } from '@/lib/services/workout-history'
import { Calendar, TrendingUp, Trophy, Target, CheckCircle2 } from 'lucide-react'
import { toast } from '@/lib/toast'
import { taskHelpers } from '@/lib/services/task-completion'
import { BackgroundTips } from '@/components/timer/background-tips'

interface TimerPageContentProps {
  challengeId: string
}

interface WorkoutHistory {
  id: string
  duration: number
  completed_at: string
}

export function TimerPageContent({ challengeId }: TimerPageContentProps) {
  const [todayWorkouts, setTodayWorkouts] = useState<WorkoutHistory[]>([])
  const [weekStats, setWeekStats] = useState({ count: 0, totalDuration: 0, avgDuration: 0 })

  useEffect(() => {
    fetchWorkoutData()
  }, [challengeId])

  const fetchWorkoutData = async () => {
    // Fetch today's workouts
    const todayData = await workoutHistoryService.getTodayWorkouts(challengeId)
    setTodayWorkouts(todayData)

    // Fetch week stats
    const stats = await workoutHistoryService.getWorkoutStats(challengeId, 7)
    setWeekStats(stats)
  }

  const handleWorkoutComplete = async (duration: number) => {
    // Save workout
    const result = await workoutHistoryService.saveWorkout(challengeId, duration)
    
    if (!result) {
      toast.error('Failed to save workout')
      return
    }

    // Update daily progress
    const workoutCount = todayWorkouts.length + 1
    await workoutHistoryService.updateDailyProgress(challengeId, workoutCount, duration)

    // Auto-complete the indoor workout task if duration >= 45 minutes
    if (duration >= 2700) { // 45 minutes in seconds
      try {
        const taskCompleted = await taskHelpers.completeIndoorWorkout(duration, `Completed ${Math.floor(duration / 60)} minute workout`)
        if (taskCompleted) {
          toast.success('Workout saved and task completed!', 'Your indoor workout task has been automatically marked as complete.')
        } else {
          toast.success('Workout saved!')
        }
      } catch (error) {
        console.error('Error auto-completing workout task:', error)
        toast.success('Workout saved!')
      }
    } else {
      toast.success('Workout saved!', `Complete ${45 - Math.floor(duration / 60)} more minutes to auto-complete your daily task.`)
    }

    // Refresh data
    fetchWorkoutData()
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes} min`
  }

  const todayTotal = todayWorkouts.reduce((sum, w) => sum + w.duration, 0)
  const hasCompletedGoal = todayWorkouts.length >= 2
  const remainingWorkouts = Math.max(0, 2 - todayWorkouts.length)

  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })
  const day = Math.ceil((today.getTime() - new Date(challengeId).getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <div className="container px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Indoor Workout</h1>
          <p className="text-muted-foreground">
            {formattedDate} • Complete a 45-minute workout
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            
            {/* Timer Section */}
            <div className="lg:col-span-2 space-y-6">
              <WorkoutTimer onComplete={handleWorkoutComplete} />
              
              {!hasCompletedGoal && (
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">Ready to crush your workout?</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Complete {remainingWorkouts} more workout{remainingWorkouts !== 1 ? 's' : ''} of 45+ minutes to reach your daily goal.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <BackgroundTips />
            </div>

            {/* Stats and Tips Sidebar */}
            <div className="space-y-6">
              
              {/* Today's Stats */}
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold mb-4 flex items-center justify-between">
                  Today's Progress
                  {hasCompletedGoal && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                  )}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Total Time</span>
                    </div>
                    <span className="text-lg font-bold">{formatDuration(todayTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Daily Goal</span>
                    </div>
                    <span className="text-lg font-bold">{todayWorkouts.length}/2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Weekly Average</span>
                    </div>
                    <span className="text-lg font-bold">{formatDuration(weekStats.avgDuration)}</span>
                  </div>
                </div>
              </div>

              {/* Today's Workouts */}
              {todayWorkouts.length > 0 && (
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-semibold mb-4 flex items-center justify-between">
                    <span>Today's Workouts</span>
                    <Badge variant="secondary" className="text-xs">
                      {todayWorkouts.length} workout{todayWorkouts.length !== 1 ? 's' : ''}
                    </Badge>
                  </h3>
                  <div className="space-y-3">
                    {todayWorkouts.map((workout, index) => (
                      <div key={workout.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">Workout {index + 1}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(workout.completed_at).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <span className="font-mono text-sm font-medium">
                          {formatDuration(workout.duration)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Workout Tips */}
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Workout Tips</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium">45-Minute Minimum</p>
                      <p className="text-xs text-muted-foreground">Each workout must be at least 45 minutes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium">Two Daily Workouts</p>
                      <p className="text-xs text-muted-foreground">Complete two workouts every day</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium">One Must Be Outdoors</p>
                      <p className="text-xs text-muted-foreground">Use the walk tracker for outdoor workouts</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium">No Back-to-Back</p>
                      <p className="text-xs text-muted-foreground">Workouts cannot be consecutive</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}