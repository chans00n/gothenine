import { createClient } from '@/lib/supabase/server'
import { getCurrentDayNumber } from '@/lib/calendar-utils'
import { getTodayInTimezone, parseDateString } from '@/lib/utils/timezone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DebugPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Not authenticated</div>
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('timezone')
    .eq('id', user.id)
    .single()
  
  const timezone = profile?.timezone || 'America/New_York'

  // Get challenge
  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!challenge) {
    return <div>No active challenge</div>
  }

  // Debug information
  const serverTime = new Date()
  const todayInTimezone = getTodayInTimezone(timezone)
  const startDateFromDB = challenge.start_date
  const startDateAsDate = new Date(startDateFromDB)
  const startDateParsed = parseDateString(startDateFromDB)
  const currentDayNumber = getCurrentDayNumber(startDateParsed, timezone)

  // Get some daily progress to check date formats
  const { data: progress } = await supabase
    .from('daily_progress')
    .select('*')
    .eq('challenge_id', challenge.id)
    .order('date', { ascending: true })
    .limit(5)

  return (
    <div className="container px-4 py-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Server & Timezone Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 font-mono text-sm">
            <div>Server Time: {serverTime.toISOString()}</div>
            <div>Server Timezone Offset: {serverTime.getTimezoneOffset()} minutes</div>
            <div>User Timezone: {timezone}</div>
            <div>Today in User Timezone: {todayInTimezone.toISOString()}</div>
            <div>Today Local String: {todayInTimezone.toLocaleDateString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Challenge Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 font-mono text-sm">
            <div>Challenge ID: {challenge.id}</div>
            <div>Start Date (from DB): {startDateFromDB}</div>
            <div>Start Date (as Date): {startDateAsDate.toISOString()}</div>
            <div>Start Date (parseDateString): {startDateParsed.toISOString()}</div>
            <div>Start Date Local: {startDateParsed.toLocaleDateString()}</div>
            <div>Start Date Timezone Offset: {startDateParsed.getTimezoneOffset()}</div>
            <div className="font-bold text-lg">Current Day Number: {currentDayNumber}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Date Calculations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 font-mono text-sm">
            <div>Today ms: {todayInTimezone.getTime()}</div>
            <div>Start ms (parsed): {startDateParsed.getTime()}</div>
            <div>Diff ms: {todayInTimezone.getTime() - startDateParsed.getTime()}</div>
            <div>Diff days (raw): {(todayInTimezone.getTime() - startDateParsed.getTime()) / (1000 * 60 * 60 * 24)}</div>
            <div>Diff days (floor): {Math.floor((todayInTimezone.getTime() - startDateParsed.getTime()) / (1000 * 60 * 60 * 24))}</div>
            <div>Day Number (floor + 1): {Math.floor((todayInTimezone.getTime() - startDateParsed.getTime()) / (1000 * 60 * 60 * 24)) + 1}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Progress Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 font-mono text-sm">
            {progress?.map((p, i) => (
              <div key={i} className="border-b pb-2">
                <div>Date (from DB): {p.date}</div>
                <div>Date (as Date): {new Date(p.date).toISOString()}</div>
                <div>Tasks Completed: {p.tasks_completed}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}