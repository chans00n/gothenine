'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { progressAggregationService, type DailyProgressAggregation, type StreakInfo } from '@/lib/services/progress-aggregation'
import { useChallenge } from '@/contexts/challenge-context'
import { 
  Trophy, 
  Flame, 
  Calendar, 
  CheckCircle2, 
  Circle,
  TrendingUp,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface ProgressSummaryProps {
  date?: Date
  showStreak?: boolean
  className?: string
}

export function ProgressSummary({ 
  date = new Date(), 
  showStreak = true,
  className 
}: ProgressSummaryProps) {
  const { currentChallenge } = useChallenge()
  const [aggregation, setAggregation] = useState<DailyProgressAggregation | null>(null)
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentChallenge) return

    const loadData = async () => {
      setLoading(true)
      try {
        const [agg, streak] = await Promise.all([
          progressAggregationService.getDailyAggregation(currentChallenge.id, date),
          showStreak ? progressAggregationService.getStreakInfo(currentChallenge.id) : null
        ])
        setAggregation(agg)
        setStreakInfo(streak)
      } catch (error) {
        console.error('Error loading progress summary:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentChallenge, date, showStreak])

  if (loading) {
    return <ProgressSummarySkeleton />
  }

  if (!aggregation || !currentChallenge) {
    return null
  }

  const progressPercentage = (aggregation.tasksCompleted / aggregation.totalTasks) * 100

  return (
    <div className={cn("space-y-4", className)}>
      {/* Streak Information */}
      {showStreak && streakInfo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Streak Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{streakInfo.currentStreak}</p>
                <p className="text-sm text-muted-foreground">Current Streak</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{streakInfo.longestStreak}</p>
                <p className="text-sm text-muted-foreground">Longest Streak</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{streakInfo.totalDaysCompleted}</p>
                <p className="text-sm text-muted-foreground">Days Complete</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Progress */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Progress
            </CardTitle>
            {aggregation.isComplete && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {aggregation.tasksCompleted} of {aggregation.totalTasks} tasks
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Task Breakdown */}
          <div className="space-y-2">
            <TaskItem
              label="Water Intake"
              completed={aggregation.waterIntake.isComplete}
              detail={`${aggregation.waterIntake.count} / ${aggregation.waterIntake.goal} oz`}
            />
            <TaskItem
              label="Indoor Workout"
              completed={aggregation.workouts.indoor}
              detail={aggregation.workouts.indoor ? "45+ minutes" : "Not completed"}
            />
            <TaskItem
              label="Outdoor Workout"
              completed={aggregation.workouts.outdoor}
              detail={aggregation.workouts.outdoor ? "45+ minutes" : "Not completed"}
            />
            <TaskItem
              label="45 Minute Walk"
              completed={aggregation.walk.completed}
              detail={aggregation.walk.duration ? `${aggregation.walk.duration} minutes` : "Not completed"}
            />
            <TaskItem
              label="Progress Photo"
              completed={aggregation.photos.count > 0}
              detail={`${aggregation.photos.count} photo${aggregation.photos.count !== 1 ? 's' : ''}`}
            />
            <TaskItem
              label="Reading"
              completed={aggregation.reading.completed}
              detail={aggregation.reading.completed ? "10+ pages" : "Not completed"}
            />
            <TaskItem
              label="Diet"
              completed={aggregation.diet.completed}
              detail={aggregation.diet.completed ? "Followed" : "Not tracked"}
            />
          </div>

          {/* Completion Celebration */}
          {aggregation.isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 text-center"
            >
              <Trophy className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <p className="font-semibold text-green-800 dark:text-green-200">
                Congratulations!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                You've completed all tasks for today!
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TaskItem({ 
  label, 
  completed, 
  detail 
}: { 
  label: string
  completed: boolean
  detail: string 
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        {completed ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
        <span className={cn(
          "text-sm font-medium",
          completed && "text-green-600 dark:text-green-400"
        )}>
          {label}
        </span>
      </div>
      <span className="text-sm text-muted-foreground">
        {detail}
      </span>
    </div>
  )
}

function ProgressSummarySkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-8 w-12 mx-auto mb-2" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-2 w-full mb-4" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}