import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { ChallengeProvider } from '@/contexts/challenge-context'
import { NotificationPermission } from '@/components/notifications/notification-permission'

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

  return (
    <ChallengeProvider>
      <AppLayout>
        <NotificationPermission />
        {children}
      </AppLayout>
    </ChallengeProvider>
  )
}