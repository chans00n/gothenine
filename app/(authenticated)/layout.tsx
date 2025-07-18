import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MinimalNav, MinimalDesktopNav } from '@/components/layouts/minimal-nav'
import { OfflineBanner } from '@/components/ui/offline-indicator'
import { NotificationBell } from '@/components/navigation/notification-bell'
import { ChallengeProvider } from '@/contexts/challenge-context'
import { NotificationPermission } from '@/components/notifications/notification-permission-simple'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Logo } from '@/components/ui/logo'
import Link from 'next/link'
import { User } from 'lucide-react'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile data
  let { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single()
  
  // If no profile exists, create one
  if (profileError?.code === 'PGRST116' || !profile) {
    const { data: newProfile } = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        display_name: user.email?.split('@')[0] || 'User',
        timezone: 'America/New_York',
        notification_preferences: {
          daily_reminder: true,
          reminder_time: '09:00',
          motivational_messages: true
        },
        created_at: new Date().toISOString()
      })
      .select('display_name, avatar_url')
      .single()
    
    profile = newProfile
  }

  return (
    <ChallengeProvider>
      <div className="flex flex-col h-screen bg-background">
        {/* Desktop sidebar */}
        <MinimalDesktopNav />
        
        {/* Main content with padding for desktop nav */}
        <div className="flex flex-col flex-1 md:pl-16">
          {/* Safe area wrapper for iOS */}
          <div className="pt-safe-6">
            {/* Minimal header bar */}
            <header className="flex-shrink-0 bg-background/80 backdrop-blur-sm border-b">
              <div className="flex items-center justify-between px-4 h-14">
              <div className="flex items-center gap-3">
                <Link href="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
                  <Logo width={100} height={32} />
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <Link href="/settings" className="flex items-center gap-2 hover:opacity-80 transition-opacity" aria-label="Go to settings">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-primary/60" />
                    )}
                  </div>
                </Link>
              </div>
            </div>
            </header>
          </div>
          
          {/* Content area - scrollable */}
          <main className="flex-1 overflow-hidden pb-16 md:pb-0">
            <OfflineBanner />
            <NotificationPermission />
            {children}
          </main>
        </div>
        
        {/* Mobile bottom nav */}
        <MinimalNav />
      </div>
    </ChallengeProvider>
  )
}