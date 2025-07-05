'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarDay, DayStatus } from '@/types/calendar'
import { taskDefinitions } from '@/lib/task-definitions'
import { createClient } from '@/lib/supabase/client'
import { 
  CheckCircle2, 
  Circle,
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'

interface EditableDayModalProps {
  isOpen: boolean
  onClose: () => void
  day: CalendarDay | null
  challengeId: string
  timezone: string
  onNavigate?: (direction: 'prev' | 'next') => void
  onUpdate?: () => void
}

interface TaskData {
  id: string
  title: string
  description: string
  completed: boolean
  completedAt?: string | null
  duration?: number
  notes?: string
  photoUrl?: string
}

export function EditableDayModal({ 
  isOpen, 
  onClose, 
  day, 
  challengeId,
  timezone,
  onNavigate,
  onUpdate 
}: EditableDayModalProps) {
  const [tasks, setTasks] = useState<TaskData[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const supabase = createClient()

  // Load task data when modal opens or day changes
  useEffect(() => {
    if (isOpen && day && challengeId) {
      loadDayData()
    }
  }, [isOpen, day, challengeId])

  const loadDayData = async () => {
    if (!day) return
    
    setLoading(true)
    try {
      // Convert date to YYYY-MM-DD format for database query
      let dateStr: string
      if (day.date instanceof Date) {
        // Adjust for timezone to ensure correct date
        const localDate = new Date(day.date.getTime() - (day.date.getTimezoneOffset() * 60000))
        dateStr = localDate.toISOString().split('T')[0]
      } else if (typeof day.date === 'string') {
        // If it's already a string, ensure it's in YYYY-MM-DD format
        dateStr = day.date.split('T')[0]
      } else {
        dateStr = String(day.date)
      }
      
      console.log('Loading data for day:', day.dayNumber, 'date:', dateStr, 'challengeId:', challengeId)
      
      // Fetch the daily progress for this specific day
      const { data: progress, error } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('date', dateStr)
        .maybeSingle() // Use maybeSingle instead of single to handle no data gracefully

      if (error) {
        console.error('Error fetching progress:', error)
        toast.error('Failed to load day data')
        return
      }

      console.log('Fetched progress:', progress)

      // Map task definitions to task data
      const taskData: TaskData[] = taskDefinitions.map(def => {
        const taskProgress = progress?.tasks?.[def.id] || {}
        return {
          id: def.id,
          title: def.title,
          description: def.description,
          completed: taskProgress.completed || false,
          completedAt: taskProgress.completedAt,
          duration: taskProgress.duration,
          notes: taskProgress.notes,
          photoUrl: taskProgress.photoUrl
        }
      })

      setTasks(taskData)
      setHasChanges(false)
    } catch (error) {
      console.error('Error loading day data:', error)
      toast.error('Failed to load day data')
    } finally {
      setLoading(false)
    }
  }

  const handleTaskToggle = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            completed: !task.completed,
            completedAt: !task.completed ? new Date().toISOString() : null
          }
        : task
    ))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!day || !hasChanges) return
    
    setSaving(true)
    try {
      // Convert date to YYYY-MM-DD format for database
      let dateStr: string
      if (day.date instanceof Date) {
        // Adjust for timezone to ensure correct date
        const localDate = new Date(day.date.getTime() - (day.date.getTimezoneOffset() * 60000))
        dateStr = localDate.toISOString().split('T')[0]
      } else if (typeof day.date === 'string') {
        // If it's already a string, ensure it's in YYYY-MM-DD format
        dateStr = day.date.split('T')[0]
      } else {
        dateStr = String(day.date)
      }

      // Convert tasks back to the format expected by the database
      const tasksData = tasks.reduce((acc, task) => {
        acc[task.id] = {
          completed: task.completed,
          completedAt: task.completedAt,
          duration: task.duration,
          notes: task.notes,
          photoUrl: task.photoUrl
        }
        return acc
      }, {} as any)

      const completedCount = tasks.filter(t => t.completed).length
      const isComplete = completedCount === 6

      // Check if record exists
      const { data: existing } = await supabase
        .from('daily_progress')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('date', dateStr)
        .maybeSingle()

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('daily_progress')
          .update({
            tasks: tasksData,
            tasks_completed: completedCount,
            is_complete: isComplete,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (error) throw error
      } else {
        // Create new record
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No user found')

        const { error } = await supabase
          .from('daily_progress')
          .insert({
            user_id: user.id,
            challenge_id: challengeId,
            date: dateStr,
            tasks: tasksData,
            tasks_completed: completedCount,
            is_complete: isComplete
          })

        if (error) throw error
      }

      toast.success('Day updated successfully!')
      setHasChanges(false)
      
      // Notify parent to refresh data
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error saving day data:', error)
      toast.error('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

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

  const completedCount = tasks.filter(t => t.completed).length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between pr-10">
          <div>
            <DialogTitle className="text-xl">Day {day.dayNumber}</DialogTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">
                {format(day.date instanceof Date ? day.date : new Date(day.date), 'EEEE, MMMM d, yyyy')}
              </span>
              <Badge 
                variant="secondary" 
                className={cn("text-xs", statusColor[day.status])}
              >
                {statusLabel[day.status]}
              </Badge>
            </div>
          </div>
          
          {/* Navigation buttons */}
          {onNavigate && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate('prev')}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate('next')}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Progress Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Tasks Completed</p>
                  <p className="text-2xl font-bold">{completedCount} / 6</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-lg font-semibold">{Math.round((completedCount / 6) * 100)}%</p>
                </div>
              </div>
              <div className="mt-3 w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${(completedCount / 6) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Task List */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              tasks.map(task => (
                <Card key={task.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => handleTaskToggle(task.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <h4 className={cn(
                          "font-medium",
                          task.completed && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {task.description}
                        </p>
                        {task.completedAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Completed at {format(new Date(task.completedAt), 'h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          {/* Notice for historical edits */}
          {day.status !== DayStatus.TODAY && day.status !== DayStatus.FUTURE && (
            <p className="text-xs text-muted-foreground text-center">
              Note: You're editing a past day. Changes will update your progress history.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}