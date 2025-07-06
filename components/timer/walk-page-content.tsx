'use client'

import { WalkTimer } from '@/components/timer/walk-timer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { walkHistoryService } from '@/lib/services/walk-history'
import { Footprints, Calendar, TrendingUp, MapPin, Target, CheckCircle2 } from 'lucide-react'
import { toast } from '@/lib/toast'
import { taskHelpers } from '@/lib/services/task-completion'
import { BackgroundTips } from '@/components/timer/background-tips'

interface WalkPageContentProps {
  challengeId: string
}

interface WalkHistory {
  id: string
  duration: number
  distance: number
  distance_unit: 'miles' | 'km'
  walk_type: 'outdoor' | 'indoor'
  completed_at: string
}

export function WalkPageContent({ challengeId }: WalkPageContentProps) {
  const [todayWalks, setTodayWalks] = useState<WalkHistory[]>([])
  const [weekStats, setWeekStats] = useState({ 
    count: 0, 
    totalDistance: 0, 
    totalDuration: 0,
    avgPace: 0 
  })

  useEffect(() => {
    fetchWalkData()
  }, [challengeId])

  const fetchWalkData = async () => {
    // Fetch today's walks
    const todayData = await walkHistoryService.getTodayWalks(challengeId)
    setTodayWalks(todayData)

    // Fetch week stats
    const stats = await walkHistoryService.getWalkStats(challengeId, 7)
    setWeekStats(stats)
  }

  const handleWalkComplete = async (duration: number, distance: number, unit: 'miles' | 'km') => {
    // Save walk
    const result = await walkHistoryService.saveWalk(
      challengeId,
      duration,
      distance,
      unit,
      'outdoor'
    )
    
    if (!result) {
      toast.error('Failed to save walk')
      return
    }

    // Update daily progress
    await walkHistoryService.updateDailyProgress(challengeId, duration, distance, unit)

    // Auto-complete the outdoor workout task if duration >= 45 minutes
    if (duration >= 2700) { // 45 minutes in seconds
      try {
        const distanceText = `${distance} ${unit}`
        const taskCompleted = await taskHelpers.completeOutdoorWorkout(duration, `Outdoor walk: ${distanceText} in ${Math.floor(duration / 60)} minutes`)
        if (taskCompleted) {
          toast.success('Walk saved and task completed!', 'Your outdoor workout task has been automatically marked as complete.')
        } else {
          toast.success('Walk saved!')
        }
      } catch (error) {
        console.error('Error auto-completing outdoor workout task:', error)
        toast.success('Walk saved!')
      }
    } else {
      toast.success('Walk saved!', `Complete ${45 - Math.floor(duration / 60)} more minutes to auto-complete your daily task.`)
    }

    // Refresh data
    fetchWalkData()
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes} min`
  }

  const formatPace = (minutesPerMile: number): string => {
    return walkHistoryService.formatPace(minutesPerMile)
  }

  const todayOutdoorWalk = todayWalks.find(w => w.walk_type === 'outdoor')
  const hasCompletedToday = !!todayOutdoorWalk

  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <div className="container px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Outdoor Walk</h1>
          <p className="text-muted-foreground">
            {formattedDate} • Track a 45-minute outdoor walk
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <BackgroundTips />
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            
            {/* Walk Timer Section */}
            <div className="lg:col-span-2 space-y-6">
              {hasCompletedToday ? (
                <div className="space-y-6">
                  <div className="text-center p-8 bg-green-50 dark:bg-green-950/20 rounded-2xl border border-green-200 dark:border-green-800">
                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                      Today's Outdoor Walk Complete!
                    </h3>
                    <p className="text-green-700 dark:text-green-300 mb-4">
                      Great job! You completed your outdoor walk today. Come back tomorrow for your next walk.
                    </p>
                    {todayOutdoorWalk && (
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-green-600 dark:text-green-400">Duration</span>
                          <p className="font-medium">{formatDuration(todayOutdoorWalk.duration)}</p>
                        </div>
                        <div>
                          <span className="text-green-600 dark:text-green-400">Distance</span>
                          <p className="font-medium">
                            {todayOutdoorWalk.distance} {todayOutdoorWalk.distance_unit}
                          </p>
                        </div>
                        <div>
                          <span className="text-green-600 dark:text-green-400">Pace</span>
                          <p className="font-medium">
                            {todayOutdoorWalk.duration > 0 && todayOutdoorWalk.distance > 0
                              ? formatPace((todayOutdoorWalk.duration / 60) / todayOutdoorWalk.distance)
                              : '—'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <WalkTimer onComplete={handleWalkComplete} />
                  
                  <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-100">Ready for your outdoor walk?</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          Complete a 45-minute outdoor walk to fulfill your daily outdoor workout requirement.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stats and Tips Sidebar */}
            <div className="space-y-6">
              
              {/* Today's Stats */}
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold mb-4 flex items-center justify-between">
                  Today's Progress
                  {hasCompletedToday && (
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
                      <span className="text-sm font-medium">Status</span>
                    </div>
                    <span className="text-lg font-bold">
                      {hasCompletedToday ? 'Complete' : 'Pending'}
                    </span>
                  </div>
                  {todayOutdoorWalk && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Distance</span>
                        </div>
                        <span className="text-lg font-bold">
                          {todayOutdoorWalk.distance} {todayOutdoorWalk.distance_unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Duration</span>
                        </div>
                        <span className="text-lg font-bold">
                          {formatDuration(todayOutdoorWalk.duration)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Weekly Stats */}
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Weekly Overview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Total Distance</span>
                    </div>
                    <span className="text-lg font-bold">
                      {weekStats.totalDistance.toFixed(1)} mi
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Walks</span>
                    </div>
                    <span className="text-lg font-bold">
                      {weekStats.count}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Avg Pace</span>
                    </div>
                    <span className="text-lg font-bold">
                      {weekStats.avgPace > 0 ? formatPace(weekStats.avgPace) : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Walk Tips */}
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Walk Tips</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium">45-Minute Minimum</p>
                      <p className="text-xs text-muted-foreground">Your walk must be at least 45 minutes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium">Outdoor Only</p>
                      <p className="text-xs text-muted-foreground">This workout must be done outdoors</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium">Track Distance</p>
                      <p className="text-xs text-muted-foreground">Monitor your distance for better insights</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium">Stay Consistent</p>
                      <p className="text-xs text-muted-foreground">Same route and pace helps track progress</p>
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