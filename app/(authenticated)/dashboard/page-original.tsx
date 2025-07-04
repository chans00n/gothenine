import { createClient } from '@/lib/supabase/server'
import { DailyOverviewCard } from '@/components/dashboard/daily-overview-card'
import { ProgressSummary } from '@/components/progress/progress-summary'
import { QuickStats } from '@/components/dashboard/quick-stats'
import { ChecklistWrapper } from '@/components/dashboard/checklist-wrapper'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { taskDefinitions, createDailyTasks } from '@/lib/task-definitions'
import { generate75DayCalendar, getCurrentDayNumber, getCalendarStats } from '@/lib/calendar-utils'
import { Card, CardContent } from '@/components/ui/card'
import { Suspense } from 'react'
import { DailyOverviewCardSkeleton } from '@/components/dashboard/daily-overview-card'
import { ProgressSummarySkeleton } from '@/components/dashboard/progress-summary'
import { QuickStatsSkeleton } from '@/components/dashboard/quick-stats'
import { DailyChecklistSkeleton } from '@/components/checklist/daily-checklist'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function getDashboardData() {
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

  // Get today in user's timezone
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

  // Fetch all progress for calendar and stats
  const { data: allProgress } = await supabase
    .from('daily_progress')
    .select('*')
    .eq('challenge_id', challengeId)
    .order('date', { ascending: true })

  // Generate calendar data
  const progressMap = allProgress?.reduce((acc, progress) => {
    // Parse the date string properly to avoid timezone issues
    // progress.date is in YYYY-MM-DD format from the database
    const [year, month, day] = progress.date.split('-').map(Number)
    const progressDate = new Date(year, month - 1, day)
    progressDate.setHours(0, 0, 0, 0)
    
    // Ensure startDate is also normalized to midnight
    const normalizedStartDate = new Date(startDate)
    normalizedStartDate.setHours(0, 0, 0, 0)
    
    // Calculate the difference in days
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
  const stats = getCalendarStats(calendarDays)

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
    stats
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  if (!data) {
    redirect('/auth/login')
  }

  const {
    currentDay,
    dailyTasks,
    completedTasks,
    calendarDays,
    stats,
    challengeId,
    startDate
  } = data

  // Create server action for task toggle
  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    'use server'
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Get user's timezone
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('timezone')
      .eq('id', user.id)
      .single()
    
    const timezone = profile?.timezone || 'America/New_York'
    
    // Get today in user's timezone
    const now = new Date()
    const todayStr = now.toLocaleDateString('en-US', { 
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    const [month, day, year] = todayStr.split('/')
    const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`

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

  // Prepare data for client components (serializable)
  const dailyOverviewData = {
    day: currentDay,
    tasks: dailyTasks.map(task => {
      const taskDef = taskDefinitions.find(t => t.id === task.taskDefinitionId)
      return {
        id: task.id,
        title: taskDef?.title || '',
        completed: task.completed,
        iconName: taskDef?.iconName
      }
    })
  }

  const calendarData = {
    startDate,
    currentDay,
    days: calendarDays
  }

  return (
    <div className="container px-4 md:px-6 py-6 md:py-8">
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
        <p className="text-muted-foreground">
          Day {currentDay} of 75 - {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Quick Stats */}
      <Suspense fallback={<QuickStatsSkeleton />}>
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Today&apos;s Overview</h2>
          <QuickStats />
        </div>
      </Suspense>

      {/* Main Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Daily Checklist - Takes up 2 columns on large screens */}
        <div className="lg:col-span-2">
          <Suspense fallback={<DailyChecklistSkeleton />}>
            <ChecklistWrapper 
              dailyTasks={dailyTasks}
              handleTaskToggle={handleTaskToggle}
            />
          </Suspense>
        </div>

        {/* Progress Summary - Takes up 1 column on large screens */}
        <div className="lg:col-span-1 space-y-6">
          <Suspense fallback={<div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="h-8 bg-muted rounded w-1/2 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          </div>}>
            <ProgressSummary 
              date={new Date()}
              showStreak={true}
            />
          </Suspense>

          <Suspense fallback={<DailyOverviewCardSkeleton />}>
            <DailyOverviewCard 
              day={dailyOverviewData.day} 
              tasks={dailyOverviewData.tasks.map(task => ({
                ...task,
                icon: undefined // Icons will be handled in client component
              }))}
              isLoading={false}
            />
          </Suspense>
        </div>
      </div>

      {/* Calendar Section - Client Component */}
      <DashboardContent 
        calendarData={calendarData}
      />
    </div>
  )
}