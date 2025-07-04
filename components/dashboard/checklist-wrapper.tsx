"use client"

import { DailyChecklist } from '@/components/checklist/daily-checklist'
import { taskDefinitions } from '@/lib/task-definitions'
import type { DailyTask } from '@/types/tasks'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface ChecklistWrapperProps {
  dailyTasks: DailyTask[]
  handleTaskToggle: (taskId: string, completed: boolean) => Promise<void>
}

export function ChecklistWrapper({ dailyTasks, handleTaskToggle }: ChecklistWrapperProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const onTaskToggle = (taskId: string, completed: boolean) => {
    // Find the task definition ID from the daily task ID
    const dailyTask = dailyTasks.find(t => t.id === taskId)
    if (!dailyTask) return

    startTransition(async () => {
      // Pass the taskDefinitionId to the server action
      await handleTaskToggle(dailyTask.taskDefinitionId, completed)
      router.refresh()
    })
  }

  return (
    <DailyChecklist 
      tasks={taskDefinitions}
      dailyTasks={dailyTasks}
      onTaskToggle={onTaskToggle}
      isLoading={isPending}
    />
  )
}