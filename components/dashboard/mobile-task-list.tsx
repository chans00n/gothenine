"use client"

import { useState } from 'react'
import { DailyTask } from '@/types/tasks'
import { taskDefinitions } from '@/lib/task-definitions'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Clock, ArrowRight, Footprints, Dumbbell, BookOpen, Camera, Droplets, Apple, CircleCheck, Circle } from 'lucide-react'
import Link from 'next/link'

interface MobileTaskListProps {
  tasks: DailyTask[]
  onTaskToggle: (taskDefinitionId: string, completed: boolean) => void | Promise<void>
}

// Icon mapping without emojis
const taskIcons: Record<string, React.ComponentType<any>> = {
  'workout-indoor': Dumbbell,
  'workout-outdoor': Footprints,
  'follow-diet': Apple,
  'water-intake': Droplets,
  'read-nonfiction': BookOpen,
  'progress-photo': Camera
}

// All tasks use primary color when completed
const completedIconColor = 'text-primary'

const taskToolMapping: Record<string, { href: string; label: string }> = {
  'workout-indoor': { href: '/timer', label: 'Start' },
  'workout-outdoor': { href: '/walk', label: 'Track' },
  'water-intake': { href: '/water', label: 'Log' },
  'progress-photo': { href: '/photos', label: 'Capture' }
}

export function MobileTaskList({ tasks, onTaskToggle }: MobileTaskListProps) {
  const [optimisticTasks, setOptimisticTasks] = useState<Record<string, boolean>>({})
  const [pendingTasks, setPendingTasks] = useState<Set<string>>(new Set())

  const handleToggle = async (taskId: string, taskDefinitionId: string, currentCompleted: boolean) => {
    if (pendingTasks.has(taskId)) return
    
    const newCompleted = !currentCompleted
    
    setPendingTasks(prev => new Set(prev).add(taskId))
    setOptimisticTasks(prev => ({ ...prev, [taskId]: newCompleted }))
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('taskToggled', {
        detail: { taskId, completed: newCompleted }
      }))
    }
    
    try {
      await onTaskToggle(taskDefinitionId, newCompleted)
      setPendingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    } catch (error) {
      console.error('Error toggling task:', error)
      setOptimisticTasks(prev => ({ ...prev, [taskId]: currentCompleted }))
      setPendingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  // Get task definition for each task
  const tasksWithDefinitions = tasks.map(task => {
    const definition = taskDefinitions.find(def => def.id === task.taskDefinitionId)
    return { ...task, definition }
  })

  // Sort tasks: incomplete first, then completed
  const sortedTasks = [...tasksWithDefinitions].sort((a, b) => {
    const aCompleted = optimisticTasks[a.id] ?? a.completed
    const bCompleted = optimisticTasks[b.id] ?? b.completed
    
    if (aCompleted && !bCompleted) return 1
    if (!aCompleted && bCompleted) return -1
    return 0
  })

  const completedCount = tasks.filter(t => optimisticTasks[t.id] ?? t.completed).length
  const totalCount = tasks.length

  return (
    <div className="space-y-4">
      {/* Progress Summary - Using accent/secondary colors */}
      <div className="bg-accent dark:bg-accent rounded-3xl p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-muted-foreground">Current tasks</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-foreground">{completedCount}</span>
            <span className="text-sm text-muted-foreground">of {totalCount}</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-4 text-foreground">
          You have{' '}
          <span className="text-3xl">{totalCount - completedCount}</span>{' '}
          task{totalCount - completedCount !== 1 ? 's' : ''}{' '}
          <span className="text-primary">for today</span>
        </h2>
        <div className="w-full bg-border rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ 
              width: `${(completedCount / totalCount) * 100}%` 
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Task Cards */}
      <div className="space-y-3">
        <AnimatePresence>
          {sortedTasks.map((task, index) => {
            if (!task.definition) return null
            
            const isCompleted = optimisticTasks[task.id] ?? task.completed
            const Icon = taskIcons[task.taskDefinitionId] || Check
            const tool = taskToolMapping[task.taskDefinitionId]
            
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
                  "relative bg-card rounded-3xl transition-all duration-300",
                  "border border-border",
                  "shadow-sm hover:shadow-md",
                  pendingTasks.has(task.id) 
                    ? "opacity-50" 
                    : "active:scale-[0.98]",
                  isCompleted && "opacity-70"
                )}
              >
                <div
                  className={cn(
                    "p-6 cursor-pointer",
                    !pendingTasks.has(task.id) && "active:bg-accent/50"
                  )}
                  onClick={() => !pendingTasks.has(task.id) && handleToggle(task.id, task.taskDefinitionId, isCompleted)}
                >
                  <div className="flex items-center gap-4">
                    {/* Checkbox - Minimal design */}
                    <div className="relative flex-shrink-0">
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 600, damping: 30 }}
                        >
                          <CircleCheck className={cn("w-7 h-7", completedIconColor)} />
                        </motion.div>
                      ) : (
                        <Circle className="w-7 h-7 text-border" />
                      )}
                    </div>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <h3 className={cn(
                            "text-xl font-bold leading-tight text-foreground",
                            isCompleted && "line-through opacity-60"
                          )}>
                            {task.definition.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.definition.description}
                          </p>
                          
                          {/* Task Meta Info */}
                          <div className="flex items-center gap-4 mt-3">
                            {/* Duration */}
                            {task.definition.requiresDuration && (
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {task.duration 
                                    ? `${Math.floor(task.duration / 60)}m`
                                    : `${task.definition.requiredDuration}m`
                                  }
                                </span>
                              </div>
                            )}

                            {/* Quick Action - Using primary colors */}
                            {!isCompleted && tool && (
                              <Link
                                href={tool.href}
                                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-medium hover:opacity-80 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {tool.label}
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                        
                        {/* Icon - Subtle placement */}
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center",
                          isCompleted ? "bg-accent" : "bg-secondary"
                        )}>
                          <Icon className={cn("w-6 h-6", isCompleted ? completedIconColor : "text-muted-foreground")} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Completion Message */}
      <AnimatePresence>
        {completedCount === totalCount && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-primary text-primary-foreground rounded-3xl p-6 text-center"
          >
            <h3 className="text-2xl font-bold mb-2">
              All tasks complete!
            </h3>
            <p className="opacity-90">
              You're doing amazing. Keep it up tomorrow!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}