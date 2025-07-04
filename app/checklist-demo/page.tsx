"use client"

import { useState } from "react"
import { DailyChecklist } from "@/components/checklist/daily-checklist"
import { taskDefinitions, createDailyTasks } from "@/lib/task-definitions"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"
import type { DailyTask } from "@/types/tasks"

export default function ChecklistDemoPage() {
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(() => 
    createDailyTasks(1).map(task => ({
      ...task,
      completed: false,
      completedAt: undefined,
      duration: undefined,
      notes: undefined,
      photoUrl: undefined
    }))
  )

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    setDailyTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              completed,
              completedAt: completed ? new Date() : undefined 
            }
          : task
      )
    )
  }

  const handleUpdateDuration = (taskId: string, duration: number) => {
    setDailyTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, duration } : task
      )
    )
  }

  const handleAddPhoto = (taskId: string) => {
    // In real app, this would open a file picker or camera
    toast.info("Photo upload", "Photo upload functionality would open here")
    setDailyTasks(prev =>
      prev.map(task =>
        task.id === taskId 
          ? { ...task, photoUrl: "demo-photo-url" } 
          : task
      )
    )
  }

  const handleAddNotes = (taskId: string, notes: string) => {
    setDailyTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, notes } : task
      )
    )
  }

  const resetTasks = () => {
    setDailyTasks(
      createDailyTasks(1).map(task => ({
        ...task,
        completed: false,
        completedAt: undefined,
        duration: undefined,
        notes: undefined,
        photoUrl: undefined
      }))
    )
    toast.success("Tasks reset", "All tasks have been reset to incomplete")
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Daily Checklist Demo</h1>
            <p className="text-muted-foreground">
              Interactive checklist component for 75 Hard tracking
            </p>
          </div>
          <Button onClick={resetTasks} variant="outline">
            Reset Tasks
          </Button>
        </div>

        <DailyChecklist
          tasks={taskDefinitions}
          dailyTasks={dailyTasks}
          onTaskToggle={handleTaskToggle}
          onUpdateDuration={handleUpdateDuration}
          onAddPhoto={handleAddPhoto}
          onAddNotes={handleAddNotes}
          isLoading={false}
        />

        <div className="mt-8 p-4 rounded-lg border bg-muted/50">
          <h3 className="font-semibold mb-2">Component Features:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>✓ Custom animated checkboxes with completion states</li>
            <li>✓ Task completion animations (check animation, progress bar)</li>
            <li>✓ Real-time progress indicators and statistics</li>
            <li>✓ Task categories with color-coded icons</li>
            <li>✓ Expandable duration inputs for timed tasks</li>
            <li>✓ Photo upload and notes functionality</li>
            <li>✓ Dark mode compatible styling</li>
            <li>✓ Motivational toasts at milestones</li>
            <li>✓ Responsive design for mobile and desktop</li>
          </ul>
        </div>
      </div>
    </div>
  )
}