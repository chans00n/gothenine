"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, Calendar, Target, Award } from "lucide-react"

interface ProgressSummaryProps {
  currentDay: number
  completedDays: number
  currentStreak: number
  longestStreak: number
  isLoading?: boolean
}

export function ProgressSummary({
  currentDay,
  completedDays,
  currentStreak,
  longestStreak,
  isLoading
}: ProgressSummaryProps) {
  if (isLoading) {
    return <ProgressSummarySkeleton />
  }

  const progressPercentage = (currentDay / 75) * 100
  const completionRate = currentDay > 0 ? (completedDays / currentDay) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Progress</CardTitle>
        <CardDescription>Track your 75 Hard journey</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Overall Progress</span>
            <span className="font-medium">{currentDay} / 75 days</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <p className="text-xs text-muted-foreground text-right">
            {progressPercentage.toFixed(0)}% complete
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Completed Days</span>
            </div>
            <p className="text-2xl font-bold">{completedDays}</p>
            <p className="text-xs text-muted-foreground">
              {completionRate.toFixed(0)}% success rate
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Current Streak</span>
            </div>
            <p className="text-2xl font-bold">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">
              consecutive days
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium">Longest Streak</span>
            </div>
            <span className="text-lg font-bold">{longestStreak} days</span>
          </div>
        </div>

        {currentDay === 75 && completedDays === 75 && (
          <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              <span className="font-medium text-green-500">
                Congratulations! You&apos;ve completed 75 Hard! 🎉
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ProgressSummarySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-16 ml-auto" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}