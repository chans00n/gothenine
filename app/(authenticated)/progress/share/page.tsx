import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SharingHub } from '@/components/progress/sharing-hub'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

async function getSharingData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get user's timezone and display name
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
    timezone,
    userName: profile?.display_name || user.email?.split('@')[0] || 'User'
  }
}

export default async function SharePage() {
  const data = await getSharingData()

  if (!data) {
    redirect('/auth/login')
  }

  if (!data.hasChallenge) {
    return (
      <div className="container px-4 md:px-6 py-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Share Your Progress</h1>
          <p className="text-muted-foreground">
            Start your 75 Hard journey to share your progress
          </p>
        </div>
        <Link href="/onboarding">
          <Button>Start Your Journey</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container px-4 md:px-6 py-6 md:py-8 pb-20">
      <div className="mb-6">
        <Link href="/progress" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Progress
        </Link>
      </div>

      <SharingHub
        challengeId={data.challengeId}
        timezone={data.timezone}
        userName={data.userName}
      />
    </div>
  )
}