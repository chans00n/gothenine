import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { statisticsService } from '@/lib/services/statistics'
import { 
  Droplets, 
  Dumbbell, 
  Footprints, 
  Camera, 
  BookOpen, 
  Apple 
} from 'lucide-react'

interface TaskBreakdownProps {
  challengeId: string
}

const taskIcons: Record<string, any> = {
  'water-intake': Droplets,
  'workout-indoor': Dumbbell,
  'workout-outdoor': Footprints,
  'progress-photo': Camera,
  'read-nonfiction': BookOpen,
  'follow-diet': Apple
}

const taskColors: Record<string, string> = {
  'water-intake': 'text-blue-600',
  'workout-indoor': 'text-purple-600',
  'workout-outdoor': 'text-green-600',
  'progress-photo': 'text-orange-600',
  'read-nonfiction': 'text-pink-600',
  'follow-diet': 'text-red-600'
}

export async function TaskBreakdown({ challengeId }: TaskBreakdownProps) {
  const stats = await statisticsService.getOverallStatistics(challengeId)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.taskBreakdown.map((task) => {
          const Icon = taskIcons[task.taskId]
          const color = taskColors[task.taskId]
          
          return (
            <div key={task.taskId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="text-sm font-medium">{task.taskName}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {task.totalCompleted}/{task.totalDays}
                </span>
              </div>
              <Progress 
                value={task.completionRate} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(task.completionRate)}% completion</span>
                <span>
                  Streak: {task.streakData.current}
                  {task.streakData.current !== task.streakData.longest && 
                    ` (Best: ${task.streakData.longest})`
                  }
                </span>
              </div>
            </div>
          )
        })}
        
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Average completion rate across all tasks:{' '}
            <span className="font-medium text-foreground">
              {Math.round(
                stats.taskBreakdown.reduce((sum, task) => sum + task.completionRate, 0) / 
                stats.taskBreakdown.length
              )}%
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}