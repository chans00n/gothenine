import { createClient } from '@/lib/supabase/server'
import { MinimalChecklist } from '@/components/dashboard/minimal-checklist'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { taskDefinitions, createDailyTasks } from '@/lib/task-definitions'
import { generate75DayCalendar, getCurrentDayNumber } from '@/lib/calendar-utils'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { DailyChecklistSkeleton } from '@/components/checklist/daily-checklist'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, TrendingUp } from 'lucide-react'

// Dashboard loading skeleton
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Hero Section Skeleton */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="container px-4 py-6 md:py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-6 bg-muted rounded-full w-16 animate-pulse" />
                  <div className="h-6 bg-muted rounded-full w-24 animate-pulse" />
                </div>
                <div className="h-8 bg-muted rounded w-48 animate-pulse" />
                <div className="h-5 bg-muted rounded w-32 animate-pulse" />
              </div>
              
              <div className="flex gap-4 md:gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center">
                    <div className="h-8 bg-muted rounded w-12 animate-pulse mb-1" />
                    <div className="h-3 bg-muted rounded w-8 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="container px-4 py-6 md:py-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <div className="md:col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-muted rounded animate-pulse" />
                    <div className="h-6 bg-muted rounded w-32 animate-pulse" />
                  </div>
                </CardHeader>
                <CardContent>
                  <DailyChecklistSkeleton />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-muted rounded animate-pulse" />
                    <div className="h-6 bg-muted rounded w-32 animate-pulse" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-5 h-5 bg-muted rounded animate-pulse" />
                    <div className="h-6 bg-muted rounded w-24 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-full animate-pulse" />
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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

  // Create daily tasks
  const dailyTasks = createDailyTasks(currentDay).map(task => {
    const taskDef = taskDefinitions.find(t => t.id === task.taskDefinitionId)
    return {
      ...task,
      title: taskDef?.title || '',
      description: taskDef?.description || '',
      requiresDuration: taskDef?.requiresDuration || false,
      completed: dailyProgress?.tasks?.[task.taskDefinitionId]?.completed || false,
      completedAt: dailyProgress?.tasks?.[task.taskDefinitionId]?.completedAt,
      duration: dailyProgress?.tasks?.[task.taskDefinitionId]?.duration,
      notes: dailyProgress?.tasks?.[task.taskDefinitionId]?.notes,
      photoUrl: dailyProgress?.tasks?.[task.taskDefinitionId]?.photoUrl,
    }
  })

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

export default async function DashboardPage() {
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
  const handleTaskToggle = async (taskDefinitionId: string, completed: boolean) => {
    'use server'
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Use the challenge ID and date from the page data (already calculated)
    const activeChallengeId = challengeId
    const currentDateStr = dateStr

    console.log('Task toggle:', { taskDefinitionId, completed, challengeId: activeChallengeId, currentDateStr })

    // Get current progress
    const { data: currentProgress, error: fetchError } = await supabase
      .from('daily_progress')
      .select('*')
      .eq('challenge_id', activeChallengeId)
      .eq('date', currentDateStr)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching progress:', fetchError)
      return
    }

    const existingTasks = currentProgress?.tasks || {}
    const updatedTasks = {
      ...existingTasks,
      [taskDefinitionId]: {
        ...existingTasks[taskDefinitionId],
        completed,
        completedAt: completed ? new Date().toISOString() : null
      }
    }

    const newCompletedCount = Object.values(updatedTasks).filter((t: any) => t.completed).length

    console.log('Task update:', { 
      existingTasks: Object.keys(existingTasks), 
      updatedTasks: Object.keys(updatedTasks), 
      newCompletedCount 
    })

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
        console.log('Progress updated successfully')
        revalidatePath('/dashboard')
      }
    } else {
      const { error } = await supabase
        .from('daily_progress')
        .insert({
          user_id: user.id,
          challenge_id: activeChallengeId,
          date: currentDateStr,
          tasks: updatedTasks,
          tasks_completed: newCompletedCount,
          is_complete: newCompletedCount === 6
        })

      if (error) {
        console.error('Error inserting progress:', error)
      } else {
        console.log('Progress inserted successfully')
        revalidatePath('/dashboard')
      }
    }
  }

  const completionRate = Math.round((completedTasks / 6) * 100)
  const completedDays = calendarDays.filter(d => d.status === 'complete').length
  const totalProgress = Math.round((completedDays / 75) * 100)

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Hero Section */}
      <DashboardHeader 
        currentDay={currentDay}
        initialCompletedTasks={completedTasks}
        initialCompletionRate={completionRate}
        totalProgress={totalProgress}
      />

      {/* Main Content */}
      <div className="container px-4 py-6 md:py-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {/* Today's Tasks - Central focus */}
            <div className="md:col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    Today's Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<DailyChecklistSkeleton />}>
                    <MinimalChecklist 
                      tasks={dailyTasks}
                      onTaskToggle={handleTaskToggle}
                    />
                  </Suspense>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions & Motivation */}
            <div className="space-y-6">
              <QuickActions />

              {/* Motivational Card */}
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Keep It Up!</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {completedDays > 0 ? (
                      `You've completed ${completedDays} day${completedDays > 1 ? 's' : ''} so far. Every day brings you closer to your goal!`
                    ) : (
                      "Today is the beginning of your transformation. Start with one task and build momentum!"
                    )}
                  </p>
                  <div className="mt-4 pt-4 border-t border-primary/20">
                    <p className="text-xs text-muted-foreground">
                      📅 Visit the <strong>Calendar</strong> page to see your full progress history and plan ahead.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}