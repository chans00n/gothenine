import { ProgressShare } from './progress-share'
import { streakTrackingService } from '@/lib/services/streak-tracking'
import { statisticsService } from '@/lib/services/statistics'
import { type BadgeType } from '@/components/ui/achievement-badge'

interface ProgressShareButtonProps {
  challengeId: string
  timezone: string
  userName: string
}

export async function ProgressShareButton({ challengeId, timezone, userName }: ProgressShareButtonProps) {
  const [streakData, overallStats] = await Promise.all([
    streakTrackingService.getStreakData(challengeId, timezone),
    statisticsService.getOverallStatistics(challengeId, timezone)
  ])

  // Map milestones to badges
  const milestones = await streakTrackingService.getMilestones(challengeId)
  const badges: BadgeType[] = []
  
  if (milestones.reached.includes(1)) badges.push('first-day')
  if (milestones.reached.includes(7)) badges.push('week-warrior')
  if (milestones.reached.includes(14)) badges.push('fortnight')
  if (milestones.reached.includes(30)) badges.push('month-master')
  if (milestones.reached.includes(38)) badges.push('halfway')
  if (milestones.reached.includes(60)) badges.push('final-stretch')
  if (milestones.reached.includes(75)) badges.push('champion')

  const stats = {
    daysComplete: overallStats.completedDays,
    currentStreak: streakData.currentStreak,
    completionRate: Math.round(overallStats.completionRate),
    badges
  }

  return <ProgressShare stats={stats} userName={userName} />
}