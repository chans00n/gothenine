"use client"

import { useState } from 'react'
import { DailyTask } from '@/types/tasks'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, Clock, ExternalLink } from 'lucide-react'
import { AnimatedCheckbox } from '@/lib/utils/micro-interactions'
import Link from 'next/link'

interface MinimalChecklistProps {
  tasks: DailyTask[]
  onTaskToggle: (taskDefinitionId: string, completed: boolean) => void | Promise<void>
}

const taskIcons: Record<string, string> = {
  'workout-indoor': '💪',
  'workout-outdoor': '🏃',
  'follow-diet': '🥗',
  'water-intake': '💧',
  'read-nonfiction': '📚',
  'progress-photo': '📸'
}

const taskToolMapping: Record<string, { href: string; label: string }> = {
  'workout-indoor': { href: '/timer', label: 'Start Timer' },
  'workout-outdoor': { href: '/walk', label: 'Start Walk' },
  'water-intake': { href: '/water', label: 'Track Water' },
  'progress-photo': { href: '/photos', label: 'Take Photo' }
}

export function MinimalChecklist({ tasks, onTaskToggle }: MinimalChecklistProps) {
  const [optimisticTasks, setOptimisticTasks] = useState<Record<string, boolean>>({})
  const [pendingTasks, setPendingTasks] = useState<Set<string>>(new Set())

  const handleToggle = async (taskId: string, taskDefinitionId: string, currentCompleted: boolean) => {
    // Prevent multiple clicks on the same task
    if (pendingTasks.has(taskId)) return
    
    const newCompleted = !currentCompleted
    
    // Mark task as pending
    setPendingTasks(prev => new Set(prev).add(taskId))
    
    // Optimistic update
    setOptimisticTasks(prev => ({ ...prev, [taskId]: newCompleted }))
    
    // Emit event for dashboard header to update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('taskToggled', {
        detail: { taskId, completed: newCompleted }
      }))
    }
    
    try {
      // Server update - use task definition ID for persistence
      await onTaskToggle(taskDefinitionId, newCompleted)
      
      // Remove from pending tasks
      setPendingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
      
      // Don't clear optimistic state immediately - let the page refresh handle it
      // This prevents the flickering issue
    } catch (error) {
      console.error('Error toggling task:', error)
      
      // Revert optimistic update on error
      setOptimisticTasks(prev => ({ ...prev, [taskId]: currentCompleted }))
      setPendingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    // Sort completed tasks to the bottom
    const aCompleted = optimisticTasks[a.id] ?? a.completed
    const bCompleted = optimisticTasks[b.id] ?? b.completed
    
    if (aCompleted && !bCompleted) return 1
    if (!aCompleted && bCompleted) return -1
    return 0
  })

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {sortedTasks.map((task, index) => {
          const isCompleted = optimisticTasks[task.id] ?? task.completed
          const emoji = taskIcons[task.taskDefinitionId] || '✓'
          
          return (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ 
                duration: 0.3,
                delay: index * 0.05,
                layout: { type: "spring", stiffness: 400, damping: 30 }
              }}
              className={cn(
                "group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300",
                pendingTasks.has(task.id) 
                  ? "cursor-wait opacity-70" 
                  : "cursor-pointer hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 active:scale-[0.98] active:transition-transform active:duration-100",
                isCompleted 
                  ? "bg-primary/5 border-primary/20 shadow-sm" 
                  : "bg-background border-border hover:border-primary/30 hover:bg-primary/5"
              )}
              onClick={() => !pendingTasks.has(task.id) && handleToggle(task.id, task.taskDefinitionId, isCompleted)}
            >
              {/* Completion indicator line */}
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1 rounded-r-full transition-all duration-300",
                isCompleted ? "bg-primary" : "bg-transparent"
              )} />

              {/* Custom checkbox */}
              <div className="relative flex-shrink-0 z-10">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center",
                    "group-hover:scale-110",
                    isCompleted 
                      ? "bg-primary border-primary shadow-lg shadow-primary/20" 
                      : "border-muted-foreground/30 group-hover:border-primary/50 group-hover:shadow-sm"
                  )}
                >
                  <AnimatePresence>
                    {isCompleted && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 600, damping: 25 }}
                      >
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Task content */}
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <span className="text-xl flex-shrink-0">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "font-medium text-sm md:text-base transition-all duration-300",
                    isCompleted 
                      ? "text-muted-foreground line-through" 
                      : "text-foreground group-hover:text-primary"
                  )}>
                    {(task as any).title || task.taskDefinitionId}
                  </h3>
                  {(task as any).description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {(task as any).description}
                    </p>
                  )}
                </div>
              </div>

              {/* Task indicators */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Duration indicator */}
                {(task as any).requiresDuration && task.duration && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                    <Clock className="w-3 h-3" />
                    {Math.floor(task.duration / 60)}m
                  </div>
                )}

                {/* Quick action button for uncompleted tasks */}
                {!isCompleted && taskToolMapping[task.taskDefinitionId] && (
                  <Link
                    href={taskToolMapping[task.taskDefinitionId].href}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-full transition-all duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3 h-3" />
                    {taskToolMapping[task.taskDefinitionId].label}
                  </Link>
                )}

                {/* Progress arrow */}
                <ChevronRight className={cn(
                  "w-4 h-4 transition-all duration-300",
                  isCompleted 
                    ? "text-primary" 
                    : "text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1"
                )} />
              </div>

              {/* Completion celebration effect */}
              <AnimatePresence>
                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 pointer-events-none rounded-xl bg-gradient-to-r from-primary/10 to-primary/5"
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Progress indicator */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">
            {tasks.filter(t => optimisticTasks[t.id] ?? t.completed).length} of {tasks.length}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
            initial={{ width: 0 }}
            animate={{ 
              width: `${(tasks.filter(t => optimisticTasks[t.id] ?? t.completed).length / tasks.length) * 100}%` 
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  )
}