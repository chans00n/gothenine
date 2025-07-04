import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  Calendar, 
  TrendingUp, 
  Target, 
  History, 
  Share2,
  CheckCircle2,
  BarChart3,
  Flame,
  Clock
} from 'lucide-react'

async function getProgressData() {
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

  const startDate = new Date(challenge.start_date)
  const now = new Date()
  const daysDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const currentDay = Math.max(1, Math.min(75, daysDiff + 1))

  // Get all progress data for this challenge
  const { data: allProgress } = await supabase
    .from('daily_progress')
    .select('*')
    .eq('challenge_id', challenge.id)
    .order('date', { ascending: false })

  // Get today's date in ISO format for comparison
  const today = new Date().toISOString().split('T')[0]
  
  // Calculate basic stats
  const totalDays = allProgress?.length || 0
  const completedDays = allProgress?.filter(p => p.tasks_completed >= 6).length || 0
  const currentStreak = calculateStreak(allProgress || [])
  
  // Check if today has any progress
  const todayProgress = allProgress?.find(p => p.date === today)
  const todayTaskCount = Math.min(todayProgress?.tasks_completed || 0, 6) // Cap at 6 tasks max
  
  // Calculate success rate based on days with progress
  const daysWithProgress = allProgress?.filter(p => p.tasks_completed > 0).length || 0
  const averageCompletion = daysWithProgress > 0 ? Math.round((completedDays / daysWithProgress) * 100) : 0

  return {
    hasChallenge: true,
    challengeId: challenge.id,
    startDate,
    currentDay,
    timezone,
    userId: user.id,
    userName: profile?.display_name || user.email?.split('@')[0] || 'User',
    stats: {
      totalDays,
      completedDays,
      currentStreak,
      averageCompletion,
      todayTaskCount,
      daysWithProgress
    }
  } as const
}

function calculateStreak(progress: any[]): number {
  if (!progress.length) return 0
  
  // Sort by date descending (most recent first)
  const sorted = progress.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  let streak = 0
  for (const day of sorted) {
    if (day.tasks_completed >= 6) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

export default async function ProgressPage() {
  const data = await getProgressData()

  if (!data) {
    redirect('/auth/login')
  }

  if (!data.hasChallenge) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b">
          <div className="container px-4 py-6 md:py-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary w-fit mx-auto">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm font-medium">Progress</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold">No Active Challenge</h1>
                <p className="text-muted-foreground">
                  Start your 75 Hard journey to track your progress
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Type guard: data.hasChallenge is true, so we know all properties exist
  const challengeData = data as Extract<typeof data, { hasChallenge: true }>

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
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Progress Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-sm font-medium">Progress</span>
                  </div>
                                     <Badge variant="secondary" className="bg-green-100 text-green-800">
                     <CheckCircle2 className="h-3 w-3 mr-1" />
                     Day {challengeData.currentDay}
                   </Badge>
                 </div>
                 <h1 className="text-2xl md:text-3xl font-bold">
                   Your Go the Nine Journey
                 </h1>
                 <p className="text-muted-foreground">
                   {formattedDate} • Track your progress and celebrate milestones
                 </p>
               </div>
               
               {/* Challenge Progress */}
               <div className="flex items-center gap-6">
                 <div className="text-center">
                   <p className="text-2xl font-bold">{challengeData.currentDay}</p>
                   <p className="text-xs text-muted-foreground">Current Day</p>
                 </div>
                 <div className="text-center">
                   <p className="text-2xl font-bold">{75 - challengeData.currentDay}</p>
                   <p className="text-xs text-muted-foreground">Days Left</p>
                 </div>
                 <div className="text-center">
                   <p className="text-2xl font-bold">{Math.round((challengeData.currentDay / 75) * 100)}%</p>
                   <p className="text-xs text-muted-foreground">Complete</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Progress Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Key Stats */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                    <Flame className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                                     <CardContent>
                     <div className="text-2xl font-bold">{challengeData.stats.currentStreak}</div>
                     <p className="text-xs text-muted-foreground">
                       {challengeData.stats.currentStreak > 0 ? 'Perfect days in a row' : 'Start your streak today'}
                     </p>
                   </CardContent>
                 </Card>

                 <Card>
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <CardTitle className="text-sm font-medium">Perfect Days</CardTitle>
                     <Trophy className="h-4 w-4 text-yellow-500" />
                   </CardHeader>
                   <CardContent>
                     <div className="text-2xl font-bold">{challengeData.stats.completedDays}</div>
                     <p className="text-xs text-muted-foreground">
                       Out of {challengeData.stats.daysWithProgress} days tracked
                     </p>
                  </CardContent>
                </Card>
              </div>

              {/* Overall Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Challenge Progress
                  </CardTitle>
                  <CardDescription>
                    Your journey through the Go the Nine challenge
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                                     <div className="space-y-2">
                     <div className="flex items-center justify-between text-sm">
                       <span>Challenge Progress</span>
                       <span>{challengeData.currentDay}/75 days</span>
                     </div>
                     <Progress value={(challengeData.currentDay / 75) * 100} className="h-2" />
                   </div>
                   
                   <div className="space-y-2">
                     <div className="flex items-center justify-between text-sm">
                       <span>Perfect Days</span>
                       <span>{challengeData.stats.completedDays}/{challengeData.stats.daysWithProgress} days</span>
                     </div>
                     <Progress value={challengeData.stats.daysWithProgress > 0 ? (challengeData.stats.completedDays / challengeData.stats.daysWithProgress) * 100 : 0} className="h-2" />
                   </div>

                   <div className="space-y-2">
                     <div className="flex items-center justify-between text-sm">
                       <span>Today's Progress</span>
                       <span>{challengeData.stats.todayTaskCount}/6 tasks</span>
                     </div>
                     <Progress value={(challengeData.stats.todayTaskCount / 6) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Your progress over the last 7 days
                  </CardDescription>
                </CardHeader>
                                 <CardContent>
                   <Suspense fallback={<div className="h-24 animate-pulse bg-muted rounded" />}>
                     <RecentActivityDisplay challengeId={challengeData.challengeId} />
                   </Suspense>
                 </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/progress/history" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <History className="h-4 w-4 mr-2" />
                      View History
                    </Button>
                  </Link>
                  <Link href="/progress/share" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Progress
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Milestone Tracker */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Milestones</CardTitle>
                  <CardDescription>
                    Key achievements in your journey
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                                     <div className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                       challengeData.stats.completedDays >= 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                     }`}>
                       {challengeData.stats.completedDays >= 1 ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                     </div>
                     <div className="flex-1">
                       <p className="text-sm font-medium">First Perfect Day</p>
                       <p className="text-xs text-muted-foreground">
                         {challengeData.stats.completedDays >= 1 ? '✓ Completed' : 'Complete all 6 tasks'}
                       </p>
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                       challengeData.stats.completedDays >= 7 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                     }`}>
                       {challengeData.stats.completedDays >= 7 ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                     </div>
                     <div className="flex-1">
                       <p className="text-sm font-medium">First Week</p>
                       <p className="text-xs text-muted-foreground">
                         {challengeData.stats.completedDays >= 7 ? '✓ Completed' : `${challengeData.stats.completedDays}/7 perfect days`}
                       </p>
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                       challengeData.currentDay >= 38 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                     }`}>
                       {challengeData.currentDay >= 38 ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                     </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Halfway Point</p>
                      <p className="text-xs text-muted-foreground">
                        {challengeData.currentDay >= 38 ? '✓ Completed' : `Day ${challengeData.currentDay}/38`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Progress Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="p-3 rounded-lg bg-primary/5">
                    <p className="font-medium">Stay Consistent</p>
                    <p className="text-muted-foreground">Focus on completing all 6 tasks daily for the best results.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5">
                    <p className="font-medium">Track Everything</p>
                    <p className="text-muted-foreground">Use the trackers to automatically complete tasks.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5">
                    <p className="font-medium">Celebrate Wins</p>
                    <p className="text-muted-foreground">Share your progress and milestone achievements.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

async function RecentActivityDisplay({ challengeId }: { challengeId: string }) {
  const supabase = await createClient()
  
  const { data: recentProgress } = await supabase
    .from('daily_progress')
    .select('date, tasks_completed')
    .eq('challenge_id', challengeId)
    .order('date', { ascending: false })
    .limit(7)

  if (!recentProgress?.length) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <p>No recent activity</p>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      {recentProgress.reverse().map((day, index) => (
        <div key={day.date} className="flex-1 text-center">
          <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-medium ${
            day.tasks_completed >= 6 
              ? 'bg-green-100 text-green-800' 
              : day.tasks_completed > 0 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-gray-100 text-gray-400'
          }`}>
            {Math.min(day.tasks_completed, 6)}
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
          </p>
        </div>
      ))}
    </div>
  )
}