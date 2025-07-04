import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsContent } from '@/components/settings/settings-content'

async function getSettingsData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('display_name, timezone, avatar_url')
    .eq('id', user.id)
    .single()

  return {
    user: {
      id: user.id,
      email: user.email || '',
      displayName: profile?.display_name || '',
      timezone: profile?.timezone || 'America/New_York',
      avatarUrl: profile?.avatar_url || ''
    }
  }
}

export default async function SettingsPage() {
  const data = await getSettingsData()

  if (!data) {
    redirect('/auth/login')
  }

  return <SettingsContent initialData={data} />
}