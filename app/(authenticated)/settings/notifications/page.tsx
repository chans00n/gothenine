import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotificationSettings } from '@/components/notifications/notification-settings'
import { ArrowLeft, Bell, CheckCircle2, Settings } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

async function getUserData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('timezone, display_name, avatar_url')
    .eq('id', user.id)
    .single()

  return {
    user: {
      id: user.id,
      email: user.email || '',
      displayName: profile?.display_name || '',
      avatarUrl: profile?.avatar_url || ''
    },
    timezone: profile?.timezone || 'America/New_York'
  }
}

export default async function NotificationSettingsPage() {
  const data = await getUserData()

  if (!data) {
    redirect('/auth/login')
  }

  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b">
        <div className="container px-4 py-6 md:py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Avatar and Back Navigation */}
              <div className="flex items-center gap-4">
                <Link 
                  href="/settings" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm">Back</span>
                </Link>
                
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-white/20 shadow-lg">
                  {data.user.avatarUrl ? (
                    <img
                      src={data.user.avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <Bell className="w-6 h-6 md:w-8 md:h-8 text-primary/50" />
                    </div>
                  )}
                </div>
              </div>

              {/* Page Info */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary">
                    <Bell className="h-4 w-4" />
                    <span className="text-sm font-medium">Notifications</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  Notification Settings
                </h1>
                <p className="text-muted-foreground">
                  {formattedDate} • Customize your reminder preferences
                </p>
              </div>
              
              {/* Quick Info */}
              <div className="flex gap-4 md:gap-6">
                <div className="text-center">
                  <p className="text-xl font-bold">{data.timezone.split('/')[1]}</p>
                  <p className="text-xs text-muted-foreground">Timezone</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">Daily</p>
                  <p className="text-xs text-muted-foreground">Reminders</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          <NotificationSettings timezone={data.timezone} />
        </div>
      </div>
    </div>
  )
}