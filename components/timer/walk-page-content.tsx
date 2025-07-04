'use client'

import { WalkTimer } from '@/components/timer/walk-timer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { walkHistoryService } from '@/lib/services/walk-history'
import { Footprints, Calendar, TrendingUp, MapPin, Target, CheckCircle2 } from 'lucide-react'
import { toast } from '@/lib/toast'
import { taskHelpers } from '@/lib/services/task-completion'

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
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="container px-4 py-6 md:py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary">
                    <Footprints className="h-4 w-4" />
                    <span className="text-sm font-medium">Outdoor Workout</span>
                  </div>
                  {hasCompletedToday && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold">Outdoor Walk</h1>
                <p className="text-muted-foreground">
                  {formattedDate} • Track your 45-minute outdoor walk
                </p>
              </div>
              
              <div className="flex gap-4 md:gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {hasCompletedToday ? '✓' : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {weekStats.totalDistance.toFixed(1)} mi
                  </p>
                  <p className="text-xs text-muted-foreground">Weekly</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {weekStats.avgPace > 0 ? formatPace(weekStats.avgPace) : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Pace</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            
            {/* Walk Timer Section */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Footprints className="h-5 w-5" />
                        Outdoor Walk Timer
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {formattedDate}
                      </CardDescription>
                    </div>
                    {hasCompletedToday && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {hasCompletedToday ? (
                    <div className="space-y-6">
                      <div className="text-center p-8 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-green-900 mb-2">
                          Today's Outdoor Walk Complete!
                        </h3>
                        <p className="text-green-700 mb-4">
                          Great job! You completed your outdoor walk today. Come back tomorrow for your next walk.
                        </p>
                        {todayOutdoorWalk && (
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-green-600">Duration</span>
                              <p className="font-medium">{formatDuration(todayOutdoorWalk.duration)}</p>
                            </div>
                            <div>
                              <span className="text-green-600">Distance</span>
                              <p className="font-medium">
                                {todayOutdoorWalk.distance} {todayOutdoorWalk.distance_unit}
                              </p>
                            </div>
                            <div>
                              <span className="text-green-600">Pace</span>
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
                      
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex items-start gap-3">
                          <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-blue-900">Ready for your outdoor walk?</p>
                            <p className="text-sm text-blue-700 mt-1">
                              Complete a 45-minute outdoor walk to fulfill your daily outdoor workout requirement.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Stats and Tips Sidebar */}
            <div className="space-y-6">
              
              {/* Today's Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Progress</CardTitle>
                  <CardDescription>
                    Your outdoor walk statistics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>

              {/* Weekly Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Overview</CardTitle>
                  <CardDescription>
                    Your walking statistics this week
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>

              {/* Walk Tips */}
              <Card>
                <CardHeader>
                  <CardTitle>Walk Tips</CardTitle>
                  <CardDescription>
                    Get the most out of your outdoor walks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}