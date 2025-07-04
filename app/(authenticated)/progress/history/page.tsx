import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HistoricalProgressView } from '@/components/progress/historical-progress-view'

async function getProgressData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get user's timezone and profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('timezone, display_name')
    .eq('id', user.id)
    .single()
  
  const timezone = profile?.timezone || 'America/New_York'

  // Get active challenge
  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!challenge) {
    return { hasChallenge: false }
  }

  return {
    hasChallenge: true,
    challengeId: challenge.id,
    startDate: new Date(challenge.start_date),
    timezone,
    userName: profile?.display_name || 'User'
  }
}

export default async function HistoricalProgressPage() {
  const data = await getProgressData()

  if (!data) {
    redirect('/auth/login')
  }

  if (!data.hasChallenge) {
    return (
      <div className="container px-4 md:px-6 py-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Historical Progress</h1>
          <p className="text-muted-foreground">
            Start your 75 Hard journey to see your progress history
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 md:px-6 py-6 md:py-8 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Historical Progress</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          View and analyze your past performance
        </p>
      </div>

      <HistoricalProgressView
        challengeId={data.challengeId}
        startDate={data.startDate || new Date()}
        timezone={data.timezone}
        userName={data.userName}
      />
    </div>
  )
}