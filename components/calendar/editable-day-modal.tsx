'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarDay, DayStatus } from '@/types/calendar'
import { taskDefinitions } from '@/lib/task-definitions'
import { createClient } from '@/lib/supabase/client'
import { parseDateString } from '@/lib/utils/timezone'
import { 
  Circle,
  CircleCheck,
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
  Footprints, 
  Dumbbell, 
  BookOpen, 
  Camera, 
  Droplets, 
  Apple
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'

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

// Icon mapping for tasks
const taskIcons: Record<string, React.ComponentType<any>> = {
  'workout-indoor': Dumbbell,
  'workout-outdoor': Footprints,
  'follow-diet': Apple,
  'water-intake': Droplets,
  'read-nonfiction': BookOpen,
  'progress-photo': Camera
}

export function EditableDayModal({ 
  isOpen, 
  onClose, 
  day, 
  challengeId,
  timezone: _timezone,
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
        // Format as YYYY-MM-DD in local time
        const year = day.date.getFullYear()
        const month = String(day.date.getMonth() + 1).padStart(2, '0')
        const dayNum = String(day.date.getDate()).padStart(2, '0')
        dateStr = `${year}-${month}-${dayNum}`
      } else if (typeof day.date === 'string') {
        // If it's already a string, ensure it's in YYYY-MM-DD format
        const dateString = day.date as string
        if (dateString.includes('T')) {
          const parsed = parseDateString(dateString)
          const year = parsed.getFullYear()
          const month = String(parsed.getMonth() + 1).padStart(2, '0')
          const dayNum = String(parsed.getDate()).padStart(2, '0')
          dateStr = `${year}-${month}-${dayNum}`
        } else {
          dateStr = dateString.split('T')[0]
        }
      } else {
        dateStr = String(day.date)
      }
      
      console.log('Loading data for day:', day.dayNumber, 'date:', dateStr, 'challengeId:', challengeId, 'raw date:', day.date)
      
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
        // Format as YYYY-MM-DD in local time
        const year = day.date.getFullYear()
        const month = String(day.date.getMonth() + 1).padStart(2, '0')
        const dayNum = String(day.date.getDate()).padStart(2, '0')
        dateStr = `${year}-${month}-${dayNum}`
      } else if (typeof day.date === 'string') {
        // If it's already a string, ensure it's in YYYY-MM-DD format
        const dateString = day.date as string
        if (dateString.includes('T')) {
          const parsed = parseDateString(dateString)
          const year = parsed.getFullYear()
          const month = String(parsed.getMonth() + 1).padStart(2, '0')
          const dayNum = String(parsed.getDate()).padStart(2, '0')
          dateStr = `${year}-${month}-${dayNum}`
        } else {
          dateStr = dateString.split('T')[0]
        }
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
                {format(
                  day.date instanceof Date 
                    ? day.date 
                    : typeof day.date === 'string' 
                      ? parseDateString(day.date) 
                      : new Date(day.date), 
                  'EEEE, MMMM d, yyyy'
                )}
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
                aria-label="Previous day"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate('next')}
                className="h-8 w-8"
                aria-label="Next day"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Progress Summary - Styled like mobile task list */}
          <div className="bg-accent dark:bg-accent rounded-3xl p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-muted-foreground">Tasks for this day</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">{completedCount}</span>
                <span className="text-sm text-muted-foreground">of 6</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              {completedCount === 6 ? (
                'All tasks complete!'
              ) : (
                <>
                  You have{' '}
                  <span className="text-3xl">{6 - completedCount}</span>{' '}
                  task{6 - completedCount !== 1 ? 's' : ''}{' '}
                  <span className="text-primary">remaining</span>
                </>
              )}
            </h2>
            <div className="w-full bg-border rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / 6) * 100}%` }}
              />
            </div>
          </div>

          {/* Task List - Styled like mobile task list */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              tasks.map(task => {
                const Icon = taskIcons[task.id] || Circle
                
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "relative bg-card rounded-3xl transition-all duration-300",
                      "border border-border",
                      "shadow-sm hover:shadow-md",
                      task.completed && "opacity-70"
                    )}
                  >
                    <div className="p-6">
                      <div className="flex items-center gap-4">
                        {/* Checkbox - Minimal design */}
                        <button
                          onClick={() => handleTaskToggle(task.id)}
                          className="relative flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
                          aria-label={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
                        >
                          {task.completed ? (
                            <CircleCheck className="w-7 h-7 text-primary" />
                          ) : (
                            <Circle className="w-7 h-7 text-border" />
                          )}
                        </button>

                        {/* Task Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <h3 className={cn(
                                "text-xl font-bold leading-tight text-foreground",
                                task.completed && "line-through opacity-60"
                              )}>
                                {task.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {task.description}
                              </p>
                              {task.completedAt && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Completed at {format(new Date(task.completedAt), 'h:mm a')}
                                </p>
                              )}
                            </div>
                            
                            {/* Icon - Subtle placement */}
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center",
                              task.completed ? "bg-accent" : "bg-secondary"
                            )}>
                              <Icon className={cn("w-6 h-6", task.completed ? "text-primary" : "text-muted-foreground")} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Action Buttons - Clean style */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="flex-1 rounded-full bg-primary text-primary-foreground hover:opacity-80"
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