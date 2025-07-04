"use client"

import { Badge } from '@/components/ui/badge'
import { CheckCircle, Circle } from 'lucide-react'
import { useState, useEffect } from 'react'

interface DashboardHeaderProps {
  currentDay: number
  initialCompletedTasks: number
  initialCompletionRate: number
  totalProgress: number
}

export function DashboardHeader({ 
  currentDay, 
  initialCompletedTasks, 
  initialCompletionRate,
  totalProgress 
}: DashboardHeaderProps) {
  const [completedTasks, setCompletedTasks] = useState(initialCompletedTasks)
  const [completionRate, setCompletionRate] = useState(initialCompletionRate)

  // Listen for task completion events
  useEffect(() => {
    const handleTaskToggle = (event: CustomEvent) => {
      const { completed } = event.detail
      setCompletedTasks(prev => completed ? prev + 1 : prev - 1)
    }

    window.addEventListener('taskToggled', handleTaskToggle as EventListener)
    
    return () => {
      window.removeEventListener('taskToggled', handleTaskToggle as EventListener)
    }
  }, [])

  // Update completion rate when completed tasks change
  useEffect(() => {
    setCompletionRate(Math.round((completedTasks / 6) * 100))
  }, [completedTasks])

  return (
    <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
      <div className="container px-4 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm font-medium">
                  Day {currentDay}
                </Badge>
                <Badge 
                  variant={completedTasks === 6 ? "default" : "secondary"}
                  className="text-sm"
                >
                  {completedTasks === 6 ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <Circle className="w-3 h-3 mr-1" />
                  )}
                  {completedTasks}/6 Complete
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {completedTasks === 6 ? "Perfect Day! 🎉" : "Keep Going! 💪"}
              </h1>
              <p className="text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-4 md:gap-6">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">
                  {completionRate}%
                </div>
                <div className="text-xs text-muted-foreground">Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">
                  {totalProgress}%
                </div>
                <div className="text-xs text-muted-foreground">Overall</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">
                  {75 - currentDay + 1}
                </div>
                <div className="text-xs text-muted-foreground">Days Left</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 