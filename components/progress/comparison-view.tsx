"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { statisticsService } from '@/lib/services/statistics-client'
import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComparisonViewProps {
  challengeId: string
  timezone: string
}

interface ComparisonData {
  current: any
  previous: any
  change: number
  trend: 'up' | 'down' | 'neutral'
}

export function ComparisonView({ challengeId, timezone }: ComparisonViewProps) {
  const [weekComparison, setWeekComparison] = useState<ComparisonData | null>(null)
  const [monthComparison, setMonthComparison] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadComparisons() {
      try {
        // Load weekly comparison
        const [currentWeek, lastWeek] = await Promise.all([
          statisticsService.getWeeklyStats(challengeId, 0, timezone),
          statisticsService.getWeeklyStats(challengeId, 1, timezone)
        ])

        const weekChange = lastWeek.totalDays > 0
          ? ((currentWeek.completionRate - lastWeek.completionRate) / lastWeek.completionRate) * 100
          : 0

        setWeekComparison({
          current: currentWeek,
          previous: lastWeek,
          change: weekChange,
          trend: weekChange > 0 ? 'up' : weekChange < 0 ? 'down' : 'neutral'
        })

        // Load monthly comparison
        const [currentMonth, lastMonth] = await Promise.all([
          statisticsService.getMonthlyStats(challengeId, 0, timezone),
          statisticsService.getMonthlyStats(challengeId, 1, timezone)
        ])

        const monthChange = lastMonth.totalDays > 0
          ? ((currentMonth.completionRate - lastMonth.completionRate) / lastMonth.completionRate) * 100
          : 0

        setMonthComparison({
          current: currentMonth,
          previous: lastMonth,
          change: monthChange,
          trend: monthChange > 0 ? 'up' : monthChange < 0 ? 'down' : 'neutral'
        })
      } catch (error) {
        console.error('Error loading comparisons:', error)
      } finally {
        setLoading(false)
      }
    }

    loadComparisons()
  }, [challengeId, timezone])

  const renderTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  const renderComparison = (data: ComparisonData | null, period: string) => {
    if (!data) return null

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Current {period}</p>
              <p className="text-2xl font-bold">{Math.round(data.current.completionRate)}%</p>
              <p className="text-xs text-muted-foreground">
                {data.current.daysCompleted}/{data.current.totalDays} days
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Previous {period}</p>
              <p className="text-2xl font-bold">{Math.round(data.previous.completionRate)}%</p>
              <p className="text-xs text-muted-foreground">
                {data.previous.daysCompleted}/{data.previous.totalDays} days
              </p>
            </CardContent>
          </Card>
        </div>

        <div className={cn(
          "flex items-center justify-center gap-2 p-4 rounded-lg",
          data.trend === 'up' && "bg-green-50 dark:bg-green-950/20",
          data.trend === 'down' && "bg-red-50 dark:bg-red-950/20",
          data.trend === 'neutral' && "bg-muted"
        )}>
          {renderTrendIcon(data.trend)}
          <p className="text-sm font-medium">
            {data.trend === 'up' && '+'}
            {data.change.toFixed(1)}% change
          </p>
        </div>

        {data.current.tasksBreakdown && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Task Comparison</h4>
            {data.current.tasksBreakdown.map((task: any, index: number) => {
              const prevTask = data.previous.tasksBreakdown?.[index]
              const taskChange = prevTask 
                ? task.completionRate - prevTask.completionRate
                : 0

              return (
                <div key={task.taskId} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{task.taskName}</span>
                  <span className={cn(
                    "font-medium",
                    taskChange > 0 && "text-green-600",
                    taskChange < 0 && "text-red-600"
                  )}>
                    {taskChange > 0 && '+'}
                    {taskChange.toFixed(0)}%
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="h-64 animate-pulse bg-muted" />
      </Card>
    )
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Progress Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="week" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="week">Week over Week</TabsTrigger>
            <TabsTrigger value="month">Month over Month</TabsTrigger>
          </TabsList>
          
          <TabsContent value="week" className="mt-4">
            {renderComparison(weekComparison, 'Week')}
          </TabsContent>
          
          <TabsContent value="month" className="mt-4">
            {renderComparison(monthComparison, 'Month')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}