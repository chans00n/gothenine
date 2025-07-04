"use client"

import { useState } from 'react'
import { DailyChecklist } from '@/components/checklist/daily-checklist'
import { PhotoCapture } from '@/components/photos/photo-capture'
import { taskDefinitions } from '@/lib/task-definitions'
import type { DailyTask } from '@/types/tasks'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ChecklistWithPhotoProps {
  dailyTasks: DailyTask[]
  challengeId: string
  handleTaskToggle: (taskId: string, completed: boolean) => Promise<void>
  handlePhotoUpload: (taskId: string, photoUrl: string) => Promise<void>
}

export function ChecklistWithPhoto({ 
  dailyTasks, 
  challengeId,
  handleTaskToggle,
  handlePhotoUpload
}: ChecklistWithPhotoProps) {
  const [isPending, startTransition] = useTransition()
  const [showPhotoCapture, setShowPhotoCapture] = useState(false)
  const [photoTaskId, setPhotoTaskId] = useState<string | null>(null)
  const router = useRouter()

  const onTaskToggle = (taskId: string, completed: boolean) => {
    const dailyTask = dailyTasks.find(t => t.id === taskId)
    if (!dailyTask) return

    startTransition(async () => {
      await handleTaskToggle(dailyTask.taskDefinitionId, completed)
      router.refresh()
    })
  }

  const onAddPhoto = (taskId: string) => {
    const dailyTask = dailyTasks.find(t => t.id === taskId)
    if (!dailyTask) return
    
    setPhotoTaskId(dailyTask.taskDefinitionId)
    setShowPhotoCapture(true)
  }

  const onPhotoUploaded = async (url: string, thumbnailUrl: string) => {
    if (!photoTaskId) return

    startTransition(async () => {
      await handlePhotoUpload(photoTaskId, url)
      setShowPhotoCapture(false)
      setPhotoTaskId(null)
      router.refresh()
    })
  }

  // Find the photo task to get current photo URL
  const photoTask = dailyTasks.find(t => {
    const taskDef = taskDefinitions.find(td => td.id === t.taskDefinitionId)
    return taskDef?.requiresPhoto
  })

  return (
    <>
      <DailyChecklist 
        tasks={taskDefinitions}
        dailyTasks={dailyTasks}
        onTaskToggle={onTaskToggle}
        onAddPhoto={onAddPhoto}
        isLoading={isPending}
      />

      <Dialog open={showPhotoCapture} onOpenChange={setShowPhotoCapture}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Take Progress Photo</DialogTitle>
          </DialogHeader>
          <PhotoCapture
            challengeId={challengeId}
            date={new Date()}
            taskId={photoTaskId || 'progress-photo'}
            onPhotoUploaded={onPhotoUploaded}
            currentPhotoUrl={photoTask?.photoUrl}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}