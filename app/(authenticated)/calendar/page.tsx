import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { CalendarWithDetails } from '@/components/calendar/calendar-with-details'
import { CalendarLegend } from '@/components/calendar/calendar-legend'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { generate75DayCalendar, getCurrentDayNumber, getCalendarStats } from '@/lib/calendar-utils'
import { parseDateString } from '@/lib/utils/timezone'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { redirect } from 'next/navigation'
import { 
  Calendar as CalendarIcon, 
  Target
} from 'lucide-react'

async function getCalendarData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch user's profile to get timezone and display name
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('timezone, display_name')
    .eq('id', user.id)
    .single()

  const timezone = profile?.timezone || 'America/New_York'
  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User'

  // Fetch user's challenge data
  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  // If no active challenge, create one
  let challengeId = challenge?.id
  let startDate: Date
  
  if (challenge?.start_date) {
    // Always use parseDateString for consistent handling
    startDate = parseDateString(challenge.start_date)
  } else {
    startDate = new Date()
  }
  
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

  const currentDay = getCurrentDayNumber(startDate, timezone)

  // Fetch all progress for calendar
  const { data: allProgress } = await supabase
    .from('daily_progress')
    .select('*')
    .eq('challenge_id', challengeId)
    .order('date', { ascending: true })

  // Generate calendar data
  const progressMap = allProgress?.reduce((acc, progress) => {
    // Parse the date string properly to avoid timezone issues
    // progress.date is in YYYY-MM-DD format from the database
    const progressDate = parseDateString(progress.date)
    
    // Ensure startDate is also normalized to midnight
    const normalizedStartDate = new Date(startDate)
    normalizedStartDate.setHours(0, 0, 0, 0)
    
    // Calculate the difference in days
    const diffTime = progressDate.getTime() - normalizedStartDate.getTime()
    const dayNum = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
    
    // Only include progress for days after the challenge started
    if (dayNum >= 1 && dayNum <= 75) {
      acc[dayNum] = {
        completed: progress.is_complete || (progress.tasks_completed >= 6),
        tasksCompleted: progress.tasks_completed || 0,
        totalTasks: 6
      }
    }
    return acc
  }, {} as any) || {}

  const calendarDays = generate75DayCalendar(startDate, progressMap, timezone)
  const stats = getCalendarStats(calendarDays)

  // Calculate streak information
  const calculateCurrentStreak = () => {
    let streak = 0
    for (let i = currentDay - 1; i >= 1; i--) {
      const day = calendarDays.find(d => d.dayNumber === i)
      if (day && progressMap[i]?.completed) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  const calculateLongestStreak = () => {
    let maxStreak = 0
    let currentStreak = 0
    
    for (let i = 1; i <= currentDay; i++) {
      if (progressMap[i]?.completed) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }
    return maxStreak
  }

  const currentStreak = calculateCurrentStreak()
  const longestStreak = calculateLongestStreak()
  const completedDays = stats.completedDays
  const completionRate = currentDay > 0 ? Math.round((completedDays / currentDay) * 100) : 0
  const overallProgress = Math.round((currentDay / 75) * 100)

  return {
    user,
    displayName,
    startDate,
    currentDay,
    calendarDays,
    stats,
    timezone,
    challengeId,
    currentStreak,
    longestStreak,
    completedDays,
    completionRate,
    overallProgress
  }
}

export default async function CalendarPage() {
  const data = await getCalendarData()

  if (!data) {
    redirect('/auth/login')
  }

  const { 
    displayName,
    startDate, 
    currentDay, 
    calendarDays, 
    stats,
    timezone,
    challengeId,
    currentStreak,
    longestStreak,
    completedDays,
    completionRate,
    overallProgress
  } = data

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b">
        <div className="container px-4 py-6 md:py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="px-3 py-1">
                    Day {currentDay}
                  </Badge>
                  <CalendarIcon className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Go the Nine Calendar
                </h1>
                <p className="text-muted-foreground">
                  Track your journey, {displayName}. See your progress and plan ahead.
                </p>
              </div>
              
              <div className="flex gap-4 md:gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{completedDays}</div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{currentStreak}</div>
                  <div className="text-xs text-muted-foreground">Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{overallProgress}%</div>
                  <div className="text-xs text-muted-foreground">Progress</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            {/* Calendar - Main focus area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Main Calendar */}
              <Suspense fallback={
                <div className="h-[400px] animate-pulse bg-muted rounded-lg" />
              }>
                <CalendarWithDetails
                  startDate={startDate}
                  currentDay={currentDay}
                  days={calendarDays}
                  challengeId={challengeId}
                  timezone={timezone}
                />
              </Suspense>

              {/* Calendar Legend */}
              <CalendarLegend />
            </div>

            {/* Progress Overview Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <QuickActions />

              {/* Motivational Tips */}
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Stay Focused</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {currentStreak > 0 ? (
                      `Amazing! You're on a ${currentStreak}-day streak. Keep the momentum going!`
                    ) : completedDays > 0 ? (
                      `You've completed ${completedDays} days so far. Every restart is a chance to build an even stronger streak.`
                    ) : (
                      "Your journey starts today. Remember: discipline creates freedom, and consistency creates transformation."
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}