import { createClient } from '@/lib/supabase/server'
import { ChecklistWithCelebration } from '@/components/checklist/checklist-with-celebration'
import { taskDefinitions, createDailyTasks } from '@/lib/task-definitions'
import { getCurrentDayNumber } from '@/lib/calendar-utils'
import { DailyChecklistSkeleton } from '@/components/checklist/daily-checklist'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

async function getChecklistData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

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
        name: '75 Hard Challenge',
        start_date: startDate.toISOString(),
        is_active: true
      })
      .select()
      .single()
    
    challengeId = newChallenge?.id
  }
  const currentDay = getCurrentDayNumber(startDate)

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
  const today = new Date(`${year}-${month}-${day}T00:00:00`)
  
  const { data: dailyProgress } = await supabase
    .from('daily_progress')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('date', today.toISOString().split('T')[0])
    .single()

  // Create daily tasks
  const dailyTasks = createDailyTasks(currentDay).map(task => ({
    ...task,
    completed: dailyProgress?.tasks?.[task.taskDefinitionId]?.completed || false,
    completedAt: dailyProgress?.tasks?.[task.taskDefinitionId]?.completedAt,
    duration: dailyProgress?.tasks?.[task.taskDefinitionId]?.duration,
    notes: dailyProgress?.tasks?.[task.taskDefinitionId]?.notes,
    photoUrl: dailyProgress?.tasks?.[task.taskDefinitionId]?.photoUrl,
  }))

  return {
    user,
    currentDay,
    challengeId,
    dailyTasks
  }
}

export default async function ChecklistPage() {
  const data = await getChecklistData()

  if (!data) {
    redirect('/auth/login')
  }

  const { currentDay, dailyTasks, challengeId } = data

  // Server action for task toggle
  const handleTaskToggle = async (taskDefinitionId: string, completed: boolean) => {
    'use server'
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('No user found')
      return
    }

    // Get user's timezone from their profile
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
      [taskDefinitionId]: {
        ...existingTasks[taskDefinitionId], // Preserve other fields like duration, notes
        completed,
        completedAt: completed ? new Date().toISOString() : null
      }
    }

    const newCompletedCount = Object.values(updatedTasks).filter((t: any) => t.completed).length

    // Prepare the data for upsert
    const progressData = {
      user_id: user.id,
      challenge_id: challengeId,
      date: dateStr,
      tasks: updatedTasks,
      tasks_completed: newCompletedCount,
      is_complete: newCompletedCount === 6
    }

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
        revalidatePath('/checklist')
        revalidatePath('/dashboard')
      }
    } else {
      const { error } = await supabase
        .from('daily_progress')
        .insert(progressData)

      if (error) {
        console.error('Error inserting progress:', error)
      } else {
        revalidatePath('/checklist')
        revalidatePath('/dashboard')
      }
    }
  }

  // Server action for photo upload
  const handlePhotoUpload = async (taskDefinitionId: string, photoUrl: string) => {
    'use server'
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('No user found')
      return
    }

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
      [taskDefinitionId]: {
        ...existingTasks[taskDefinitionId],
        photoUrl,
        completed: true,
        completedAt: new Date().toISOString()
      }
    }

    const newCompletedCount = Object.values(updatedTasks).filter((t: any) => t.completed).length

    // Update task in database
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
        console.error('Error updating progress with photo:', error)
      } else {
        revalidatePath('/checklist')
        revalidatePath('/dashboard')
        revalidatePath('/photos')
        revalidatePath('/calendar')
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
        console.error('Error inserting progress with photo:', error)
      } else {
        revalidatePath('/checklist')
        revalidatePath('/dashboard')
        revalidatePath('/photos')
        revalidatePath('/calendar')
      }
    }
  }

  return (
    <div className="container px-4 py-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Daily Tasks</h1>
        <p className="text-muted-foreground">
          Day {currentDay} of 75 - Complete all tasks to maintain your streak
        </p>
      </div>

      <Suspense fallback={<DailyChecklistSkeleton />}>
        <ChecklistWithCelebration 
          dailyTasks={dailyTasks}
          challengeId={challengeId}
          handleTaskToggle={handleTaskToggle}
          handlePhotoUpload={handlePhotoUpload}
        />
      </Suspense>

      <div className="mt-8 p-4 rounded-lg bg-muted/50">
        <h3 className="font-semibold mb-2">75 Hard Rules</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Two 45-minute workouts (one must be outdoors)</li>
          <li>• Follow a diet with no cheat meals or alcohol</li>
          <li>• Drink 1 gallon of water</li>
          <li>• Read 10 pages of a non-fiction book</li>
          <li>• Take a progress photo</li>
        </ul>
      </div>
    </div>
  )
}