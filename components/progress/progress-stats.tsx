"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartConfig, ChartContainer } from '@/components/ui/chart'
import { RadialBarChart, RadialBar, PolarGrid, PolarRadiusAxis, Label } from 'recharts'
import { Trophy, Calendar, TrendingUp, TrendingDown, Target } from 'lucide-react'
import { streakTrackingService } from '@/lib/services/streak-tracking-client'
import { statisticsService } from '@/lib/services/statistics-client'
import { useEffect, useState } from 'react'

interface ProgressStatsProps {
  challengeId: string
  timezone: string
}

interface Stat {
  iconName: 'trophy' | 'calendar' | 'trending-up' | 'target'
  label: string
  value: string | number
  displayValue: string | number
  subtext: string
  color: string
  progress: number
  fillColor: string
  chartColor: string
  trend?: number
  trendLabel?: string
}

const iconMap = {
  'trophy': Trophy,
  'calendar': Calendar,
  'trending-up': TrendingUp,
  'target': Target
}

export function ProgressStats({ challengeId, timezone }: ProgressStatsProps) {
  const [stats, setStats] = useState<Stat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const [streakData, overallStats] = await Promise.all([
          streakTrackingService.getStreakData(challengeId, timezone),
          statisticsService.getOverallStatistics(challengeId, timezone)
        ])

        const statsData: Stat[] = [
          {
            iconName: 'trophy',
            label: 'Current Streak',
            value: streakData.currentStreak,
            displayValue: streakData.currentStreak,
            subtext: 'Days',
            color: 'text-yellow-600',
            progress: Math.min(100, (streakData.currentStreak / 75) * 100),
            fillColor: 'var(--chart-1)',
            chartColor: 'chart-1',
            trend: streakData.isActiveStreak ? 5.2 : -100,
            trendLabel: streakData.isActiveStreak ? 'Active streak' : 'Streak ended'
          },
          {
            iconName: 'calendar',
            label: 'Days Completed',
            value: overallStats.completedDays,
            displayValue: overallStats.completedDays,
            subtext: 'Days',
            color: 'text-blue-600',
            progress: Math.min(100, (overallStats.completedDays / 75) * 100),
            fillColor: 'var(--chart-2)',
            chartColor: 'chart-2',
            trend: overallStats.completedDays > 0 ? 3.1 : 0,
            trendLabel: `${75 - overallStats.completedDays} days remaining`
          },
          {
            iconName: 'trending-up',
            label: 'Completion Rate',
            value: overallStats.completionRate,
            displayValue: Math.round(overallStats.completionRate),
            subtext: 'Percent',
            color: 'text-green-600',
            progress: overallStats.completionRate,
            fillColor: 'var(--chart-3)',
            chartColor: 'chart-3',
            trend: overallStats.completionRate > 90 ? 2.4 : -1.2,
            trendLabel: `${overallStats.completedDays} perfect days completed`
          },
          {
            iconName: 'target',
            label: 'Average Tasks',
            value: overallStats.averageTasksPerDay,
            displayValue: overallStats.averageTasksPerDay.toFixed(1),
            subtext: 'Per Day',
            color: 'text-purple-600',
            progress: Math.min(100, (overallStats.averageTasksPerDay / 6) * 100),
            fillColor: 'var(--chart-4)',
            chartColor: 'chart-4',
            trend: overallStats.averageTasksPerDay >= 5 ? 4.3 : -2.1,
            trendLabel: 'Out of 6 possible tasks'
          }
        ]

        setStats(statsData)
      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [challengeId, timezone])

  if (loading) {
    return (
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="flex flex-col">
            <CardContent className="flex-1 pb-0">
              <div className="h-[250px] animate-pulse bg-muted rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {stats.map((stat, index) => {
        const chartData = [{
          value: stat.progress,
          fill: stat.fillColor
        }]

        const chartConfig = {
          value: {
            label: stat.label,
            color: stat.fillColor
          }
        } satisfies ChartConfig

        return (
          <Card key={index} className="flex flex-col">
            <CardHeader className="items-center pb-0">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <RadialBarChart
                  data={chartData}
                  startAngle={90}
                  endAngle={450}
                  innerRadius={80}
                  outerRadius={110}
                >
                  <PolarGrid
                    gridType="circle"
                    radialLines={false}
                    stroke="none"
                    className="first:fill-muted last:fill-background"
                    polarRadius={[86, 74]}
                  />
                  <RadialBar 
                    dataKey="value" 
                    background
                    cornerRadius={10}
                    maxBarSize={10}
                    fill={stat.fillColor}
                  />
                  <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-4xl font-bold"
                              >
                                {stat.displayValue}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-muted-foreground"
                              >
                                {stat.subtext}
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </PolarRadiusAxis>
                </RadialBarChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 font-medium leading-none">
                {stat.trend && stat.trend > 0 ? (
                  <>
                    Trending up by {stat.trend.toFixed(1)}% <TrendingUp className="h-4 w-4" />
                  </>
                ) : stat.trend && stat.trend < 0 ? (
                  <>
                    {stat.trend === -100 ? 'Inactive' : `Down by ${Math.abs(stat.trend).toFixed(1)}%`} <TrendingDown className="h-4 w-4" />
                  </>
                ) : (
                  <>No change</>
                )}
              </div>
              <div className="leading-none text-muted-foreground">
                {stat.trendLabel}
              </div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}