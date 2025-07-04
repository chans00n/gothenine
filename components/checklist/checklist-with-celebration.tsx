'use client'

import { useState, useEffect } from 'react'
import { DailyChecklist } from './daily-checklist'
import { PhotoCapture } from '@/components/photos/photo-capture'
import { ProgressCelebration } from '@/components/ui/progress-celebration'
import { SimpleProgressSummary } from '@/components/progress/simple-progress-summary'
import { useDailyProgress } from '@/hooks/use-daily-progress'
import { useChallenge } from '@/contexts/challenge-context'
import { Button } from '@/components/ui/button'
import { taskDefinitions } from '@/lib/task-definitions'
import { toast } from '@/lib/toast'
import { Camera } from 'lucide-react'

interface ChecklistWithCelebrationProps {
  dailyTasks: any[]
  challengeId: string
  handleTaskToggle: (taskId: string, completed: boolean) => Promise<void>
  handlePhotoUpload: (taskId: string, photoUrl: string) => Promise<void>
}

export function ChecklistWithCelebration({
  dailyTasks,
  challengeId,
  handleTaskToggle,
  handlePhotoUpload
}: ChecklistWithCelebrationProps) {
  const { currentChallenge } = useChallenge()
  const [showPhotoCapture, setShowPhotoCapture] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  
  const { aggregation, currentDay, reload } = useDailyProgress({
    date: new Date(), // Explicitly use today's date
    onComplete: () => setShowCelebration(true)
  })

  // Force reload when component mounts
  useEffect(() => {
    reload()
  }, [reload]) // Include reload in dependencies

  const handlePhotoClick = (taskId: string) => {
    setCurrentTaskId(taskId)
    setShowPhotoCapture(true)
  }

  const handlePhotoCaptured = async (photoUrl: string) => {
    if (!currentTaskId) return
    
    await handlePhotoUpload(currentTaskId, photoUrl)
    setShowPhotoCapture(false)
    setCurrentTaskId(null)
    toast.success('Photo uploaded successfully!')
    
    // Reload aggregation to check for completion
    setTimeout(reload, 1000)
  }

  // Get streak info from aggregation
  // Show streak only if we've completed today
  const streakCount = aggregation?.isComplete ? 1 : 0

  // Map tasks with photo support
  const tasksWithActions = dailyTasks.map(task => {
    const taskDef = taskDefinitions.find(t => t.id === task.taskDefinitionId)
    const hasPhoto = taskDef?.requiresPhoto || false
    
    return {
      ...task,
      action: hasPhoto ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handlePhotoClick(task.taskDefinitionId)}
          className="gap-2"
        >
          <Camera className="h-4 w-4" />
          Photo
        </Button>
      ) : undefined
    }
  })

  return (
    <div className="space-y-6">
      {/* Progress Summary Card */}
      <SimpleProgressSummary 
        tasks={dailyTasks.reduce((acc, task) => {
          acc[task.taskDefinitionId] = {
            completed: task.completed,
            completedAt: task.completedAt
          }
          return acc
        }, {} as Record<string, { completed: boolean; completedAt?: string | null }>)}
        className="lg:hidden"
      />

      {/* Daily Checklist */}
      <DailyChecklist
        tasks={taskDefinitions}
        dailyTasks={tasksWithActions}
        onTaskToggle={async (taskId, completed) => {
          // Find the task definition ID from the daily task ID
          const dailyTask = dailyTasks.find(t => t.id === taskId)
          if (!dailyTask) return
          
          await handleTaskToggle(dailyTask.taskDefinitionId, completed)
          // Reload aggregation to check for completion
          setTimeout(reload, 1000)
        }}
        isLoading={false}
      />

      {/* Photo Capture Modal */}
      {showPhotoCapture && (
        <PhotoCapture
          challengeId={challengeId}
          onPhotoCaptured={handlePhotoCaptured}
          onClose={() => {
            setShowPhotoCapture(false)
            setCurrentTaskId(null)
          }}
        />
      )}

      {/* Completion Celebration */}
      <ProgressCelebration
        show={showCelebration}
        type="day"
        message={`Day ${currentDay} complete! Keep going strong!`}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Desktop Progress Summary */}
      <div className="hidden lg:block mt-8">
        <SimpleProgressSummary 
          tasks={dailyTasks.reduce((acc, task) => {
            acc[task.taskDefinitionId] = {
              completed: task.completed,
              completedAt: task.completedAt
            }
            return acc
          }, {} as Record<string, { completed: boolean; completedAt?: string | null }>)}
        />
      </div>
    </div>
  )
}