"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ChecklistItem } from "./checklist-item"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  CheckCircle2, 
  Circle, 
  Trophy,
  Zap,
  Target,
  TrendingUp
} from "lucide-react"
import type { TaskDefinition, DailyTask, TaskProgress } from "@/types/tasks"
import { toast } from "@/lib/toast"

interface DailyChecklistProps {
  tasks: TaskDefinition[]
  dailyTasks: DailyTask[]
  onTaskToggle: (taskId: string, completed: boolean) => void
  onUpdateDuration?: (taskId: string, duration: number) => void
  onAddPhoto?: (taskId: string) => void
  onAddNotes?: (taskId: string, notes: string) => void
  isLoading?: boolean
}

export function DailyChecklist({
  tasks,
  dailyTasks,
  onTaskToggle,
  onUpdateDuration,
  onAddPhoto,
  onAddNotes,
  isLoading
}: DailyChecklistProps) {
  const [lastCompletedId, setLastCompletedId] = useState<string | null>(null)

  const progress = useMemo<TaskProgress>(() => {
    const completed = dailyTasks.filter(t => t.completed).length
    const total = dailyTasks.length
    return {
      totalTasks: total,
      completedTasks: completed,
      percentage: total > 0 ? (completed / total) * 100 : 0,
      remainingTasks: total - completed
    }
  }, [dailyTasks])

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    onTaskToggle(taskId, completed)
    
    if (completed) {
      setLastCompletedId(taskId)
      
      // Show motivational toast based on progress
      if (progress.completedTasks === progress.totalTasks - 1) {
        toast.success("Almost there!", "Just one more task to complete today! 💪")
      } else if (progress.completedTasks === Math.floor(progress.totalTasks / 2) - 1) {
        toast.success("Halfway there!", "Keep pushing, you're doing great! 🎯")
      } else if (progress.completedTasks === 0) {
        toast.success("Great start!", "First task down, keep the momentum going! 🚀")
      }
      
      // Check if all tasks completed
      if (progress.completedTasks === progress.totalTasks - 1) {
        setTimeout(() => {
          toast.success("Day Complete! 🎉", "Congratulations on completing all tasks today!")
        }, 500)
      }
    }
  }

  if (isLoading) {
    return <DailyChecklistSkeleton />
  }

  const isAllComplete = progress.percentage === 100

  return (
    <Card className={isAllComplete ? "border-green-500 shadow-green-500/20 shadow-lg" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">Daily Tasks</CardTitle>
            <CardDescription>
              Complete all tasks to maintain your streak
            </CardDescription>
          </div>
          <div className="text-right">
            <motion.div
              key={progress.completedTasks}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex items-center gap-2"
            >
              {isAllComplete ? (
                <Trophy className="h-5 w-5 text-yellow-500" />
              ) : progress.percentage >= 50 ? (
                <Zap className="h-5 w-5 text-orange-500" />
              ) : (
                <Target className="h-5 w-5 text-blue-500" />
              )}
              <span className="text-2xl font-bold">
                {progress.completedTasks}/{progress.totalTasks}
              </span>
            </motion.div>
            <p className="text-sm text-muted-foreground mt-1">
              {isAllComplete ? "All done! 🎉" : `${progress.remainingTasks} remaining`}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Today&apos;s Progress</span>
            <span className="font-medium">{Math.round(progress.percentage)}%</span>
          </div>
          <Progress 
            value={progress.percentage} 
            className="h-2"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">{progress.completedTasks}</span>
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1">
              <Circle className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">{progress.remainingTasks}</span>
            </div>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">{Math.round(progress.percentage)}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Progress</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <motion.div
          layout
          className="space-y-3"
        >
          {dailyTasks.map((dailyTask, index) => {
            const task = tasks.find(t => t.id === dailyTask.taskDefinitionId)
            if (!task) return null

            return (
              <motion.div
                key={dailyTask.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ChecklistItem
                  task={task}
                  dailyTask={dailyTask}
                  onToggle={handleTaskToggle}
                  onUpdateDuration={onUpdateDuration}
                  onAddPhoto={onAddPhoto}
                  onAddNotes={onAddNotes}
                />
              </motion.div>
            )
          })}
        </motion.div>

        {isAllComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center"
          >
            <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <h3 className="font-semibold text-lg">Day Complete!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You&apos;ve successfully completed all tasks for today. Keep it up!
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}

export function DailyChecklistSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 p-4 rounded-xl border bg-background animate-pulse"
        >
          {/* Checkbox skeleton */}
          <div className="w-6 h-6 rounded-full bg-muted flex-shrink-0" />
          
          {/* Content skeleton */}
          <div className="flex-1 flex items-center gap-3">
            <div className="w-6 h-6 bg-muted rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
          
          {/* Arrow skeleton */}
          <div className="w-4 h-4 bg-muted rounded flex-shrink-0" />
        </div>
      ))}
      
      {/* Progress bar skeleton */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex justify-between items-center mb-2">
          <div className="h-3 bg-muted rounded w-16" />
          <div className="h-3 bg-muted rounded w-12" />
        </div>
        <div className="h-2 bg-muted rounded-full" />
      </div>
    </div>
  )
}