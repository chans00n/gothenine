import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProgressShare } from './progress-share'
import { ShareTemplates } from './share-templates'
import { statisticsService } from '@/lib/services/statistics'
import { streakTrackingService } from '@/lib/services/streak-tracking'
import { type BadgeType } from '@/components/ui/achievement-badge'

interface SharingHubProps {
  challengeId: string
  timezone: string
  userName: string
}

export async function SharingHub({ challengeId, timezone, userName }: SharingHubProps) {
  const [streakData, overallStats, milestones] = await Promise.all([
    streakTrackingService.getStreakData(challengeId, timezone),
    statisticsService.getOverallStatistics(challengeId, timezone),
    streakTrackingService.getMilestones(challengeId)
  ])

  // Calculate total workouts
  const totalWorkouts = overallStats.completedDays * 2 // 2 workouts per day

  // Get best streak
  const bestStreak = Math.max(streakData.currentStreak, streakData.longestStreak || 0)

  // Map milestones to badges
  const badges: BadgeType[] = []
  if (milestones.reached.includes(1)) badges.push('first-day')
  if (milestones.reached.includes(7)) badges.push('week-warrior')
  if (milestones.reached.includes(14)) badges.push('fortnight')
  if (milestones.reached.includes(30)) badges.push('month-master')
  if (milestones.reached.includes(38)) badges.push('halfway')
  if (milestones.reached.includes(60)) badges.push('final-stretch')
  if (milestones.reached.includes(75)) badges.push('champion')

  const shareStats = {
    daysComplete: overallStats.completedDays,
    currentStreak: streakData.currentStreak,
    completionRate: Math.round(overallStats.completionRate),
    badges
  }

  const templateStats = {
    daysComplete: overallStats.completedDays,
    currentStreak: streakData.currentStreak,
    completionRate: Math.round(overallStats.completionRate),
    totalWorkouts,
    bestStreak
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Share Your Journey</h2>
          <p className="text-muted-foreground">
            Inspire others by sharing your progress
          </p>
        </div>
        <ProgressShare stats={shareStats} userName={userName} />
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="tips">Sharing Tips</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="space-y-4">
          <ShareTemplates stats={templateStats} />
        </TabsContent>
        
        <TabsContent value="tips" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-6">
              <h3 className="font-semibold mb-2">Best Times to Share</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Monday mornings for motivation</li>
                <li>• After completing milestones</li>
                <li>• Weekend accountability checks</li>
                <li>• When you overcome challenges</li>
              </ul>
            </div>
            
            <div className="rounded-lg border p-6">
              <h3 className="font-semibold mb-2">Engagement Tips</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Use relevant hashtags</li>
                <li>• Share honest struggles</li>
                <li>• Celebrate small wins</li>
                <li>• Encourage others to join</li>
              </ul>
            </div>
            
            <div className="rounded-lg border p-6">
              <h3 className="font-semibold mb-2">Content Ideas</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Before/after photos</li>
                <li>• Daily workout summaries</li>
                <li>• Meal prep inspiration</li>
                <li>• Book recommendations</li>
              </ul>
            </div>
            
            <div className="rounded-lg border p-6">
              <h3 className="font-semibold mb-2">Community Building</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Find accountability partners</li>
                <li>• Join 75 Hard groups</li>
                <li>• Share tips and tricks</li>
                <li>• Support others' journeys</li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}