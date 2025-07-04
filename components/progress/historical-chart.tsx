"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState, lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Dynamically import recharts to avoid SSR issues
const LineChart = lazy(() => import('recharts').then(module => ({ default: module.LineChart })))
const Line = lazy(() => import('recharts').then(module => ({ default: module.Line })))
const BarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart })))
const Bar = lazy(() => import('recharts').then(module => ({ default: module.Bar })))
const AreaChart = lazy(() => import('recharts').then(module => ({ default: module.AreaChart })))
const Area = lazy(() => import('recharts').then(module => ({ default: module.Area })))
const XAxis = lazy(() => import('recharts').then(module => ({ default: module.XAxis })))
const YAxis = lazy(() => import('recharts').then(module => ({ default: module.YAxis })))
const CartesianGrid = lazy(() => import('recharts').then(module => ({ default: module.CartesianGrid })))
const Tooltip = lazy(() => import('recharts').then(module => ({ default: module.Tooltip })))
const ResponsiveContainer = lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })))
const Legend = lazy(() => import('recharts').then(module => ({ default: module.Legend })))

interface HistoricalChartProps {
  data: {
    dailyProgress: Array<{
      date: string
      dayNumber: number
      completionRate: number
      tasksCompleted: number
      isComplete: boolean
    }>
    taskBreakdown: Array<{
      taskId: string
      taskName: string
      completionData: Array<{
        date: string
        completed: boolean
      }>
    }>
  }
}

export function HistoricalChart({ data }: HistoricalChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line')
  const [selectedTask, setSelectedTask] = useState<string>('all')

  // Format data for charts
  const chartData = data.dailyProgress.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    dayNumber: day.dayNumber,
    completion: Math.round(day.completionRate),
    tasks: day.tasksCompleted,
    isComplete: day.isComplete
  }))

  // Calculate task-specific data if a task is selected
  const taskData = selectedTask !== 'all' ? 
    data.taskBreakdown.find(t => t.taskId === selectedTask)?.completionData.map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completed: d.completed ? 100 : 0
    })) : null

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))'
              }}
            />
            <Bar 
              dataKey="completion" 
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              name="Completion %"
            />
          </BarChart>
        )
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="completion" 
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
              name="Completion %"
            />
          </AreaChart>
        )
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="completion" 
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 6 }}
              name="Completion %"
            />
            <Line 
              type="monotone" 
              dataKey="tasks" 
              stroke="hsl(var(--secondary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--secondary))', r: 4 }}
              activeDot={{ r: 6 }}
              name="Tasks (x16.67)"
              yAxisId="right"
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              domain={[0, 6]}
            />
          </LineChart>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Progress Visualization</CardTitle>
          <div className="flex gap-2">
            <Select value={selectedTask} onValueChange={setSelectedTask}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select task" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                {data.taskBreakdown.map(task => (
                  <SelectItem key={task.taskId} value={task.taskId}>
                    {task.taskName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </Suspense>
        </div>
      </CardContent>
    </Card>
  )
}