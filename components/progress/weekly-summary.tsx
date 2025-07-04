import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { statisticsService } from '@/lib/services/statistics'
import { CalendarDays, TrendingUp, Award } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface WeeklySummaryProps {
  challengeId: string
  timezone: string
}

export async function WeeklySummary({ challengeId, timezone }: WeeklySummaryProps) {
  const [currentWeek, lastWeek] = await Promise.all([
    statisticsService.getWeeklyStats(challengeId, 0, timezone),
    statisticsService.getWeeklyStats(challengeId, 1, timezone)
  ])

  const weekComparison = lastWeek.totalDays > 0 
    ? ((currentWeek.completionRate - lastWeek.completionRate) / lastWeek.completionRate) * 100
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          This Week's Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Weekly Progress</span>
            <span className="text-sm text-muted-foreground">
              {currentWeek.daysCompleted}/{currentWeek.totalDays} days
            </span>
          </div>
          <Progress 
            value={currentWeek.completionRate} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(currentWeek.completionRate)}% completion rate
          </p>
        </div>

        {weekComparison !== 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <TrendingUp className={`h-4 w-4 ${weekComparison > 0 ? 'text-green-600' : 'text-red-600'}`} />
            <p className="text-sm">
              {weekComparison > 0 ? '+' : ''}{weekComparison.toFixed(1)}% vs last week
            </p>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-sm font-medium">Daily Breakdown</h4>
          <div className="grid grid-cols-7 gap-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
              const dayData = currentWeek.tasksBreakdown[0] // This would need proper day mapping
              const isComplete = index < currentWeek.daysCompleted
              
              return (
                <div
                  key={index}
                  className={`aspect-square rounded flex items-center justify-center text-xs font-medium ${
                    isComplete 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {day}
                </div>
              )
            })}
          </div>
        </div>

        {currentWeek.perfectDays > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10">
            <Award className="h-4 w-4 text-yellow-600" />
            <p className="text-sm">
              <span className="font-medium">{currentWeek.perfectDays}</span> perfect days this week!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}