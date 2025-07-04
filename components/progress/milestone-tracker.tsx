"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AchievementBadge, type BadgeType } from '@/components/ui/achievement-badge'
import { streakTrackingService } from '@/lib/services/streak-tracking-client'
import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Target, Trophy, Zap } from 'lucide-react'
import { MilestoneShare } from './milestone-share'

interface MilestoneTrackerProps {
  challengeId: string
}

interface Milestone {
  day: number
  label: string
  description: string
  iconName: 'target' | 'trophy' | 'zap'
  reached: boolean
  current: boolean
  badge?: BadgeType
}

const milestoneConfig: Record<number, { label: string; description: string; iconName: 'target' | 'trophy' | 'zap'; badge?: BadgeType }> = {
  7: { 
    label: 'First Week', 
    description: 'Building momentum',
    iconName: 'zap',
    badge: 'week-warrior'
  },
  14: { 
    label: 'Two Weeks', 
    description: 'Habit forming',
    iconName: 'target',
    badge: 'fortnight'
  },
  21: { 
    label: 'Three Weeks', 
    description: 'Neural pathways',
    iconName: 'target',
    badge: undefined
  },
  30: { 
    label: 'One Month', 
    description: 'Major milestone!',
    iconName: 'trophy',
    badge: 'month-master'
  },
  40: { 
    label: '40 Days', 
    description: 'Over halfway',
    iconName: 'target',
    badge: undefined
  },
  50: { 
    label: '50 Days', 
    description: 'Final stretch',
    iconName: 'target',
    badge: undefined
  },
  60: { 
    label: '60 Days', 
    description: 'Almost there',
    iconName: 'zap',
    badge: 'final-stretch'
  },
  70: { 
    label: '70 Days', 
    description: 'Home stretch',
    iconName: 'target',
    badge: undefined
  },
  75: { 
    label: '75 Hard', 
    description: 'Champion!',
    iconName: 'trophy',
    badge: 'champion'
  }
}

const iconMap = {
  target: Target,
  trophy: Trophy,
  zap: Zap
}

export function MilestoneTracker({ challengeId }: MilestoneTrackerProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [badges, setBadges] = useState<BadgeType[]>([])
  const [currentDay, setCurrentDay] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMilestones() {
      try {
        const data = await streakTrackingService.getMilestones(challengeId)
        const streakData = await streakTrackingService.getStreakData(challengeId)
        
        setCurrentDay(streakData.totalCompletedDays)
        
        const milestoneList = Object.entries(milestoneConfig).map(([dayStr, config]) => {
          const day = parseInt(dayStr)
          return {
            day,
            ...config,
            reached: data.reached.includes(day),
            current: data.next === day
          }
        })
        
        setMilestones(milestoneList)
        
        // Extract badges for reached milestones
        const reachedBadges = milestoneList
          .filter(m => m.reached && m.badge)
          .map(m => m.badge as BadgeType)
        
        // Add first day badge if applicable
        if (streakData.totalCompletedDays >= 1 && !reachedBadges.includes('first-day')) {
          reachedBadges.unshift('first-day')
        }
        
        setBadges(reachedBadges)
      } catch (error) {
        console.error('Error loading milestones:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMilestones()
  }, [challengeId])

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="h-48 animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  const nextMilestone = milestones.find(m => !m.reached)
  const progressToNext = nextMilestone 
    ? Math.min(100, (currentDay / nextMilestone.day) * 100)
    : 100

  return (
    <div className="space-y-4 sm:space-y-6 mb-6">
      {/* Next Milestone Card */}
      {nextMilestone && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg truncate">Next Milestone</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Day {nextMilestone.day} - {nextMilestone.label}
                </CardDescription>
              </div>
              {(() => {
                const Icon = iconMap[nextMilestone.iconName]
                return <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0 ml-2" />
              })()}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {currentDay} / {nextMilestone.day} days
                </span>
              </div>
              <Progress value={progressToNext} className="h-2 sm:h-3" />
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                {nextMilestone.day - currentDay} days until {nextMilestone.description.toLowerCase()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievement Badges */}
      {badges.length > 0 && (
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Achievements Unlocked</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Your earned badges on this journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-4">
              {badges.map((badge) => (
                <AchievementBadge
                  key={badge}
                  type={badge}
                  size="sm"
                  unlocked
                  showLabel={false}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestone Timeline - Simplified for mobile */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Milestone Timeline</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Your progress through 75 Hard milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-5 sm:left-6 top-6 sm:top-8 bottom-6 sm:bottom-8 w-0.5 bg-border" />
            <div 
              className="absolute left-5 sm:left-6 top-6 sm:top-8 w-0.5 bg-primary transition-all duration-500"
              style={{ 
                height: `${Math.min(100, (currentDay / 75) * 100)}%`
              }}
            />

            {/* Milestones */}
            <div className="space-y-4 sm:space-y-6">
              {milestones.map((milestone) => {
                const Icon = iconMap[milestone.iconName]
                return (
                  <div key={milestone.day} className="flex items-center gap-3 sm:gap-4">
                    <div className="relative">
                      {milestone.reached ? (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary flex items-center justify-center relative">
                          <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                        </div>
                      ) : milestone.current ? (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-muted bg-background flex items-center justify-center">
                          <Circle className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm sm:text-base font-medium truncate flex-1 ${
                          milestone.reached ? 'text-foreground' : 
                          milestone.current ? 'text-primary' : 
                          'text-muted-foreground'
                        }`}>
                          Day {milestone.day} - <span className="hidden sm:inline">{milestone.label}</span>
                          <span className="sm:hidden">{milestone.label.split(' ')[0]}</span>
                        </p>
                        {milestone.reached && (
                          <MilestoneShare
                            milestone={milestone}
                            currentDay={currentDay}
                            userName="User"
                            className="shrink-0"
                          />
                        )}
                        {milestone.reached && milestone.badge && (
                          <div className="shrink-0">
                            <AchievementBadge
                              type={milestone.badge}
                              size="sm"
                              unlocked
                              showLabel={false}
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}