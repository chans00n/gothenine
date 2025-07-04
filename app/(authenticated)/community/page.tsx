import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CommunityLeaderboard } from '@/components/community/community-leaderboard'
import { Users, Trophy, Calendar, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

async function getCommunityData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  try {
    // Get all users with their profiles including avatar
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, display_name, avatar_url')
      .order('display_name')

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return { users: [], currentUserId: user.id }
    }

    // Get all active challenges
    const { data: challenges, error: challengesError } = await supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true)

    if (challengesError) {
      console.error('Error fetching challenges:', challengesError)
    }

    // Get today's progress for all users
    const today = new Date().toISOString().split('T')[0]
    const { data: todayProgress, error: progressError } = await supabase
      .from('daily_progress')
      .select('*')
      .eq('date', today)

    if (progressError) {
      console.error('Error fetching progress:', progressError)
    }

    // Transform and combine the data - only show users with active challenges
    const communityUsers = (users || [])
      .map(profile => {
        const activeChallenge = challenges?.find(c => c.user_id === profile.id && c.is_active)
        const userProgress = todayProgress?.find(p => p.user_id === profile.id && p.challenge_id === activeChallenge?.id)
      
      // Calculate current day
      let currentDay = 0
      if (activeChallenge?.start_date) {
        const startDate = new Date(activeChallenge.start_date)
        const today = new Date()
        currentDay = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        currentDay = Math.max(1, Math.min(currentDay, 75))
      }

      // Count completed tasks
      let tasksCompleted = 0
      if (userProgress?.tasks) {
        tasksCompleted = Object.values(userProgress.tasks).filter((task: any) => task.completed).length
      }

      return {
        id: profile.id,
        displayName: profile.display_name || 'Anonymous',
        avatarUrl: profile.avatar_url || undefined,
        currentDay,
        challengeName: activeChallenge?.name || '75 Hard',
        tasksCompleted,
        totalTasks: 6, // 75 Hard has 6 daily tasks
        startedAt: activeChallenge?.start_date,
        isCurrentUser: profile.id === user.id,
        hasActiveChallenge: !!activeChallenge
      }
    })

    return {
      users: communityUsers,
      currentUserId: user.id
    }
  } catch (error) {
    console.error('Error in getCommunityData:', error)
    return { users: [], currentUserId: user.id }
  }
}

export default async function CommunityPage() {
  const data = await getCommunityData()

  if (!data) {
    redirect('/auth/login')
  }

  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  // Calculate some stats
  const activeUsers = data.users.length
  const completedToday = data.users.filter(u => u.tasksCompleted === u.totalTasks).length
  const avgDay = data.users.length > 0 
    ? Math.round(data.users.reduce((sum, u) => sum + u.currentDay, 0) / data.users.length)
    : 0

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b">
        <div className="container px-4 py-6 md:py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Icon and Title */}
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary">
                      <Trophy className="h-4 w-4" />
                      <span className="text-sm font-medium">Community</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {activeUsers} Active
                    </Badge>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    Community Leaderboard
                  </h1>
                  <p className="text-muted-foreground">
                    {formattedDate} • See how everyone is doing today
                  </p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex gap-4 md:gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{completedToday}</p>
                  <p className="text-xs text-muted-foreground">Completed Today</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">Day {avgDay}</p>
                  <p className="text-xs text-muted-foreground">Average Day</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{activeUsers}</p>
                  <p className="text-xs text-muted-foreground">Active Users</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <CommunityLeaderboard 
            users={data.users}
            currentUserId={data.currentUserId}
          />
        </div>
      </div>
    </div>
  )
}