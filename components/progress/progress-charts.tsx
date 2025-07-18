"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { statisticsService } from '@/lib/services/statistics-client'
import { useEffect, useState, lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Dynamically import recharts to avoid SSR issues
const LineChart = lazy(() => import('recharts').then(module => ({ default: module.LineChart })))
const Line = lazy(() => import('recharts').then(module => ({ default: module.Line })))
const BarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart })))
const Bar = lazy(() => import('recharts').then(module => ({ default: module.Bar })))
const XAxis = lazy(() => import('recharts').then(module => ({ default: module.XAxis })))
const YAxis = lazy(() => import('recharts').then(module => ({ default: module.YAxis })))
const CartesianGrid = lazy(() => import('recharts').then(module => ({ default: module.CartesianGrid })))
const Tooltip = lazy(() => import('recharts').then(module => ({ default: module.Tooltip })))
const ResponsiveContainer = lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })))
const Legend = lazy(() => import('recharts').then(module => ({ default: module.Legend })))

interface ProgressChartsProps {
  challengeId: string
  timezone: string
}

export function ProgressCharts({ challengeId, timezone }: ProgressChartsProps) {
  const [trends, setTrends] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const trendData = await statisticsService.getProgressTrends(challengeId, 30)
        
        // Format data for charts
        const formattedData = trendData.map(trend => ({
          day: `Day ${trend.dayNumber}`,
          dayNumber: trend.dayNumber,
          completion: Math.round(trend.completionRate),
          tasks: trend.tasksCompleted,
          date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }))
        
        setTrends(formattedData)
      } catch (error) {
        console.error('Error loading progress trends:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [challengeId])

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Progress Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Progress Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="completion" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="completion">Completion Rate</TabsTrigger>
            <TabsTrigger value="tasks">Tasks Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="completion" className="mt-4">
            <div className="h-[300px] w-full">
              <Suspense fallback={<Skeleton className="h-full w-full" />}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
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
                    <Line 
                      type="monotone" 
                      dataKey="completion" 
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Completion %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Suspense>
            </div>
          </TabsContent>
          
          <TabsContent value="tasks" className="mt-4">
            <div className="h-[300px] w-full">
              <Suspense fallback={<Skeleton className="h-full w-full" />}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'currentColor' }}
                      domain={[0, 6]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))'
                      }}
                    />
                    <Bar 
                      dataKey="tasks" 
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      name="Tasks"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Suspense>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}