"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartConfig, ChartContainer } from '@/components/ui/chart'
import { RadialBarChart, RadialBar, PolarGrid, PolarRadiusAxis, Label } from 'recharts'
import { TrendingUp, TrendingDown, Calendar, CheckCircle } from 'lucide-react'

interface HistoricalStatsProps {
  data: {
    totalDays: number
    completedDays: number
    failedDays: number
    totalTasks: number
    completedTasks: number
    completionRate: number
    bestStreak: number
    averageTasksPerDay: number
    trends: {
      completionRate: number
      tasksPerDay: number
    }
  }
}

export function HistoricalStats({ data }: HistoricalStatsProps) {
  const stats = [
    {
      label: 'Completion Rate',
      value: data.completionRate,
      displayValue: Math.round(data.completionRate),
      subtext: 'Percent',
      fillColor: 'var(--chart-3)',
      progress: data.completionRate,
      trend: data.trends.completionRate,
      trendLabel: `${data.completedDays} of ${data.totalDays} days completed`
    },
    {
      label: 'Tasks Completed',
      value: data.completedTasks,
      displayValue: data.completedTasks.toLocaleString(),
      subtext: 'Tasks',
      fillColor: 'var(--chart-2)',
      progress: (data.completedTasks / data.totalTasks) * 100,
      trend: null,
      trendLabel: `Out of ${data.totalTasks.toLocaleString()} total tasks`
    },
    {
      label: 'Best Streak',
      value: data.bestStreak,
      displayValue: data.bestStreak,
      subtext: 'Days',
      fillColor: 'var(--chart-1)',
      progress: Math.min(100, (data.bestStreak / 75) * 100),
      trend: null,
      trendLabel: 'Longest consecutive days'
    },
    {
      label: 'Average Tasks',
      value: data.averageTasksPerDay,
      displayValue: data.averageTasksPerDay.toFixed(1),
      subtext: 'Per Day',
      fillColor: 'var(--chart-4)',
      progress: (data.averageTasksPerDay / 6) * 100,
      trend: data.trends.tasksPerDay,
      trendLabel: 'Out of 6 possible tasks'
    }
  ]

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const chartData = [{
          name: stat.label,
          value: stat.progress,
          fill: stat.fillColor
        }]

        const chartConfig = {
          [stat.label]: {
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
                    fill={stat.fillColor}
                    maxBarSize={10}
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
                {stat.trend !== null ? (
                  stat.trend > 0 ? (
                    <>
                      Up {Math.abs(stat.trend).toFixed(1)}% from previous period <TrendingUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Down {Math.abs(stat.trend).toFixed(1)}% from previous period <TrendingDown className="h-4 w-4" />
                    </>
                  )
                ) : (
                  <span className="text-muted-foreground">No comparison available</span>
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