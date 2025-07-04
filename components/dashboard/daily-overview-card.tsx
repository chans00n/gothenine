"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, Clock } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface DailyTask {
  id: string
  title: string
  completed: boolean
  icon?: React.ReactNode
}

interface DailyOverviewCardProps {
  day: number
  tasks: DailyTask[]
  isLoading?: boolean
}

export function DailyOverviewCard({ day, tasks, isLoading }: DailyOverviewCardProps) {
  if (isLoading) {
    return <DailyOverviewCardSkeleton />
  }

  const completedTasks = tasks.filter(task => task.completed).length
  const totalTasks = tasks.length
  const isComplete = completedTasks === totalTasks

  return (
    <Card className={isComplete ? "border-green-500" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Day {day} of 75</CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{completedTasks}/{totalTasks}</div>
            <p className="text-sm text-muted-foreground">Tasks Complete</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
          >
            <div className="flex items-center gap-3">
              {task.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                {task.title}
              </span>
            </div>
            {task.icon}
          </div>
        ))}
        {!isComplete && (
          <Button className="w-full mt-4" size="lg">
            <Clock className="mr-2 h-4 w-4" />
            Start Today&apos;s Tasks
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function DailyOverviewCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-10 w-16 ml-auto" />
            <Skeleton className="h-4 w-24 ml-auto" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
        <Skeleton className="h-12 w-full mt-4" />
      </CardContent>
    </Card>
  )
}