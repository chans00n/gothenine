'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarDay, DayStatus } from '@/types/calendar'
import { progressAggregationService } from '@/lib/services/progress-aggregation'
import { useChallenge } from '@/contexts/challenge-context'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Droplets, 
  Dumbbell, 
  Footprints,
  Camera,
  BookOpen,
  Apple,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

interface DayDetailModalProps {
  isOpen: boolean
  onClose: () => void
  day: CalendarDay | null
  onNavigate?: (direction: 'prev' | 'next') => void
}

export function DayDetailModal({ isOpen, onClose, day, onNavigate }: DayDetailModalProps) {
  const { currentChallenge } = useChallenge()
  const [aggregation, setAggregation] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && day && currentChallenge) {
      setLoading(true)
      progressAggregationService.getDailyAggregation(currentChallenge.id, day.date)
        .then(setAggregation)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [isOpen, day, currentChallenge])

  if (!day) return null

  const statusColor = {
    [DayStatus.COMPLETE]: 'text-green-600 bg-green-100 dark:bg-green-900/20',
    [DayStatus.PARTIAL]: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
    [DayStatus.INCOMPLETE]: 'text-red-600 bg-red-100 dark:bg-red-900/20',
    [DayStatus.SKIPPED]: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20',
    [DayStatus.TODAY]: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
    [DayStatus.FUTURE]: 'text-gray-400 bg-gray-50 dark:bg-gray-900/20'
  }

  const statusLabel = {
    [DayStatus.COMPLETE]: 'Complete',
    [DayStatus.PARTIAL]: 'Partial',
    [DayStatus.INCOMPLETE]: 'Incomplete',
    [DayStatus.SKIPPED]: 'Skipped',
    [DayStatus.TODAY]: 'Today',
    [DayStatus.FUTURE]: 'Upcoming'
  }

  const tasks = [
    { 
      id: 'water-intake', 
      label: 'Water Intake', 
      icon: Droplets, 
      completed: aggregation?.waterIntake?.isComplete,
      details: aggregation?.waterIntake ? `${aggregation.waterIntake.count}/${aggregation.waterIntake.goal} oz` : null
    },
    { 
      id: 'workout-indoor', 
      label: 'Indoor Workout', 
      icon: Dumbbell, 
      completed: aggregation?.workouts?.indoor,
      details: aggregation?.workouts?.indoor ? '45 minutes' : null
    },
    { 
      id: 'workout-outdoor', 
      label: 'Outdoor Workout', 
      icon: Footprints, 
      completed: aggregation?.workouts?.outdoor,
      details: aggregation?.workouts?.outdoor ? '45 minutes' : null
    },
    { 
      id: 'progress-photo', 
      label: 'Progress Photo', 
      icon: Camera, 
      completed: aggregation?.photos?.count > 0,
      details: aggregation?.photos?.count ? `${aggregation.photos.count} photo${aggregation.photos.count > 1 ? 's' : ''}` : null
    },
    { 
      id: 'read-nonfiction', 
      label: 'Read 10 Pages', 
      icon: BookOpen, 
      completed: aggregation?.reading?.completed 
    },
    { 
      id: 'follow-diet', 
      label: 'Follow Diet', 
      icon: Apple, 
      completed: aggregation?.diet?.completed 
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <DialogTitle className="text-xl">Day {day.dayNumber} of 75</DialogTitle>
            </div>
            <Badge className={cn("ml-2", statusColor[day.status])}>
              {statusLabel[day.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {format(day.date, 'EEEE, MMMM d, yyyy')}
          </p>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Navigation */}
          {onNavigate && (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('prev')}
                disabled={day.dayNumber === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous Day
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('next')}
                disabled={day.dayNumber === 75}
              >
                Next Day
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Progress Overview */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Progress Overview</h3>
                <span className="text-sm text-muted-foreground">
                  {day.tasksCompleted} of {day.totalTasks} tasks completed
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mb-4">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all",
                    day.tasksCompleted === day.totalTasks ? "bg-green-500" :
                    day.tasksCompleted > 0 ? "bg-yellow-500" : "bg-gray-300"
                  )}
                  style={{ width: `${(day.tasksCompleted / day.totalTasks) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Task Details */}
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tasks" className="mt-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map(task => {
                    const Icon = task.icon
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg border",
                          task.completed ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" :
                          "bg-muted/50 border-border"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={cn(
                            "h-5 w-5",
                            task.completed ? "text-green-600" : "text-muted-foreground"
                          )} />
                          <div>
                            <p className={cn(
                              "font-medium",
                              task.completed && "text-green-700 dark:text-green-400"
                            )}>
                              {task.label}
                            </p>
                            {task.details && (
                              <p className="text-sm text-muted-foreground">{task.details}</p>
                            )}
                          </div>
                        </div>
                        <div>
                          {task.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="notes" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {aggregation?.notes?.hasNotes ? (
                    <div className="prose dark:prose-invert max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: aggregation.notes.content || 'No notes for this day.' }} />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No notes recorded for this day</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Photos Section */}
          {aggregation?.photos?.count > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Progress Photos</h3>
                <div className="grid grid-cols-2 gap-4">
                  {aggregation.photos.urls.map((url: string, index: number) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={url} 
                        alt={`Progress photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}