'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SimpleProgressSummaryProps {
  tasks: Record<string, { completed: boolean; completedAt?: string | null }>
  className?: string
}

const taskLabels: Record<string, string> = {
  'water-intake': 'Water Intake',
  'workout-indoor': 'Indoor Workout',
  'workout-outdoor': 'Outdoor Workout',
  'follow-diet': 'Follow Diet',
  'read-nonfiction': 'Read 10 Pages',
  'progress-photo': 'Progress Photo'
}

export function SimpleProgressSummary({ tasks, className }: SimpleProgressSummaryProps) {
  const taskEntries = Object.entries(tasks || {})
  const completedCount = taskEntries.filter(([_, task]) => task.completed).length
  const totalCount = Object.keys(taskLabels).length
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Today's Progress</CardTitle>
          {completedCount === totalCount && (
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
              {completedCount} of {totalCount} tasks
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="space-y-2">
          {Object.entries(taskLabels).map(([taskId, label]) => {
            const task = tasks[taskId]
            const isCompleted = task?.completed || false
            
            return (
              <div key={taskId} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={cn(
                    "text-sm font-medium",
                    isCompleted && "text-green-600 dark:text-green-400"
                  )}>
                    {label}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {isCompleted ? "Complete" : "Pending"}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}