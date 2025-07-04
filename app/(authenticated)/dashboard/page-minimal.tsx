import { createClient } from '@/lib/supabase/server'
import { ChecklistWrapper } from '@/components/dashboard/checklist-wrapper'
import { MinimalCalendar } from '@/components/dashboard/minimal-calendar'
import { taskDefinitions, createDailyTasks } from '@/lib/task-definitions'
import { generate75DayCalendar, getCurrentDayNumber } from '@/lib/calendar-utils'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { DailyChecklistSkeleton } from '@/components/checklist/daily-checklist'

async function getMinimalDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get user's profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('timezone, onboarding_completed')
    .eq('id', user.id)
    .single()
  
  // Redirect to onboarding if not completed
  if (!profile?.onboarding_completed) {
    redirect('/onboarding')
  }
  
  const timezone = profile?.timezone || 'America/New_York'

  // Fetch user's challenge data
  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  // If no active challenge, create one
  let challengeId = challenge?.id
  let startDate = challenge?.start_date ? new Date(challenge.start_date) : new Date()
  
  if (!challenge) {
    const { data: newChallenge } = await supabase
      .from('challenges')
      .insert({
        user_id: user.id,
        start_date: startDate.toISOString(),
        is_active: true
      })
      .select()
      .single()
    
    challengeId = newChallenge?.id
  }

  const currentDay = getCurrentDayNumber(startDate, timezone)

  // Get today's date in user's timezone
  const now = new Date()
  const todayStr = now.toLocaleDateString('en-US', { 
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const [month, day, year] = todayStr.split('/')
  const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  
  const { data: dailyProgress } = await supabase
    .from('daily_progress')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('date', dateStr)
    .single()

  // Fetch all progress for calendar
  const { data: allProgress } = await supabase
    .from('daily_progress')
    .select('*')
    .eq('challenge_id', challengeId)
    .order('date', { ascending: true })

  // Generate calendar data
  const progressMap = allProgress?.reduce((acc, progress) => {
    const [year, month, day] = progress.date.split('-').map(Number)
    const progressDate = new Date(year, month - 1, day)
    progressDate.setHours(0, 0, 0, 0)
    
    const normalizedStartDate = new Date(startDate)
    normalizedStartDate.setHours(0, 0, 0, 0)
    
    const diffTime = progressDate.getTime() - normalizedStartDate.getTime()
    const dayNum = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
    acc[dayNum] = {
      completed: progress.is_complete || false,
      tasksCompleted: progress.tasks_completed || 0,
      totalTasks: 6
    }
    return acc
  }, {} as any) || {}

  const calendarDays = generate75DayCalendar(startDate, progressMap, timezone)

  // Create daily tasks
  const dailyTasks = createDailyTasks(currentDay).map(task => ({
    ...task,
    completed: dailyProgress?.tasks?.[task.taskDefinitionId]?.completed || false,
    completedAt: dailyProgress?.tasks?.[task.taskDefinitionId]?.completedAt,
    duration: dailyProgress?.tasks?.[task.taskDefinitionId]?.duration,
    notes: dailyProgress?.tasks?.[task.taskDefinitionId]?.notes,
    photoUrl: dailyProgress?.tasks?.[task.taskDefinitionId]?.photoUrl,
  }))

  const completedTasks = dailyTasks.filter(t => t.completed).length

  return {
    user,
    currentDay,
    startDate,
    challengeId,
    dailyProgress,
    dailyTasks,
    completedTasks,
    calendarDays,
    dateStr,
    timezone
  }
}

export default async function MinimalDashboardPage() {
  const data = await getMinimalDashboardData()

  if (!data) {
    redirect('/auth/login')
  }

  const {
    currentDay,
    dailyTasks,
    completedTasks,
    calendarDays,
    challengeId,
    startDate,
    dateStr,
    timezone
  } = data

  // Create server action for task toggle
  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    'use server'
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Get current progress
    const { data: currentProgress, error: fetchError } = await supabase
      .from('daily_progress')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('date', dateStr)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching progress:', fetchError)
      return
    }

    const existingTasks = currentProgress?.tasks || {}
    const updatedTasks = {
      ...existingTasks,
      [taskId]: {
        ...existingTasks[taskId],
        completed,
        completedAt: completed ? new Date().toISOString() : null
      }
    }

    const newCompletedCount = Object.values(updatedTasks).filter((t: any) => t.completed).length

    // If we have existing progress, update it; otherwise insert
    if (currentProgress) {
      const { error } = await supabase
        .from('daily_progress')
        .update({
          tasks: updatedTasks,
          tasks_completed: newCompletedCount,
          is_complete: newCompletedCount === 6
        })
        .eq('id', currentProgress.id)

      if (error) {
        console.error('Error updating progress:', error)
      } else {
        revalidatePath('/dashboard')
      }
    } else {
      const { error } = await supabase
        .from('daily_progress')
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
          date: dateStr,
          tasks: updatedTasks,
          tasks_completed: newCompletedCount,
          is_complete: newCompletedCount === 6
        })

      if (error) {
        console.error('Error inserting progress:', error)
      } else {
        revalidatePath('/dashboard')
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Clean header */}
      <div className="border-b">
        <div className="container px-4 py-6">
          <div className="flex items-baseline justify-between">
            <div>
              <h1 className="text-2xl font-medium">Day {currentDay}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {completedTasks} of 6 tasks complete
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="container px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Daily Tasks */}
          <div>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Today's Tasks
            </h2>
            <Suspense fallback={<DailyChecklistSkeleton />}>
              <ChecklistWrapper 
                dailyTasks={dailyTasks}
                handleTaskToggle={handleTaskToggle}
              />
            </Suspense>
          </div>

          {/* Calendar */}
          <div>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Progress Overview
            </h2>
            <MinimalCalendar
              startDate={startDate}
              currentDay={currentDay}
              days={calendarDays}
            />
          </div>
        </div>
      </div>
    </div>
  )
}