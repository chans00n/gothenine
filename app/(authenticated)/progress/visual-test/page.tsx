"use client"

import { useState } from 'react'
import { ProgressRing } from '@/components/ui/progress-ring'
import { ProgressBar } from '@/components/ui/progress-bar'
import { AchievementBadge, type BadgeType } from '@/components/ui/achievement-badge'
import { ProgressCelebration } from '@/components/ui/progress-celebration'
import { ProgressShare } from '@/components/progress/progress-share'
import { ThemeSelector } from '@/components/progress/theme-selector'
import { ProgressThemeProvider } from '@/lib/contexts/progress-theme'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function VisualTestPage() {
  const [celebrationType, setCelebrationType] = useState<'task' | 'day' | 'milestone' | 'complete' | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)

  const triggerCelebration = (type: 'task' | 'day' | 'milestone' | 'complete') => {
    setCelebrationType(type)
    setShowCelebration(true)
  }

  const sampleStats = {
    daysComplete: 42,
    currentStreak: 15,
    completionRate: 87,
    badges: ['week-warrior', 'month-master', 'halfway'] as BadgeType[]
  }

  const allBadges: BadgeType[] = [
    'first-day', 'week-warrior', 'fortnight', 'month-master',
    'halfway', 'final-stretch', 'champion', 'perfect-week',
    'comeback', 'early-bird'
  ]

  return (
    <ProgressThemeProvider>
      <div className="container max-w-6xl py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Visual Progress Elements Test</h1>
          <p className="text-muted-foreground">
            Testing all visual components and animations for the progress tracking system
          </p>
        </div>

        <Tabs defaultValue="rings" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="rings">Progress Rings</TabsTrigger>
            <TabsTrigger value="bars">Progress Bars</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="celebrations">Celebrations</TabsTrigger>
            <TabsTrigger value="themes">Themes</TabsTrigger>
          </TabsList>

          <TabsContent value="rings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Progress Rings</CardTitle>
                <CardDescription>Circular progress indicators with animations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <ProgressRing value={75} label="Daily" color="primary" />
                  <ProgressRing value={90} label="Weekly" color="success" />
                  <ProgressRing value={45} label="Monthly" color="warning" />
                  <ProgressRing value={20} label="Overall" color="danger" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Different Sizes</h3>
                  <div className="flex items-center gap-6">
                    <ProgressRing value={60} size={80} label="Small" />
                    <ProgressRing value={60} size={120} label="Medium" />
                    <ProgressRing value={60} size={160} label="Large" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Without Animation</h3>
                  <ProgressRing value={85} animate={false} label="Static" color="info" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bars" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Progress Bars</CardTitle>
                <CardDescription>Horizontal progress indicators with various styles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <ProgressBar value={75} label="Task Progress" showValue />
                  <ProgressBar value={90} label="Daily Progress" showValue color="success" />
                  <ProgressBar value={45} label="Weekly Progress" showValue color="warning" />
                  <ProgressBar value={20} label="Monthly Progress" showValue color="danger" />
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Different Sizes</h3>
                  <ProgressBar value={60} size="sm" label="Small" />
                  <ProgressBar value={60} size="md" label="Medium" />
                  <ProgressBar value={60} size="lg" label="Large" />
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Striped & Animated</h3>
                  <ProgressBar value={70} striped label="Striped" showValue />
                  <ProgressBar value={70} striped animated label="Animated Stripes" showValue color="info" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Achievement Badges</CardTitle>
                <CardDescription>Milestone and achievement badges with unlock animations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-medium">Unlocked Badges</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {allBadges.slice(0, 5).map((badge) => (
                      <AchievementBadge key={badge} type={badge} unlocked />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Locked Badges</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {allBadges.slice(5).map((badge) => (
                      <AchievementBadge key={badge} type={badge} unlocked={false} />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Different Sizes</h3>
                  <div className="flex items-end gap-4">
                    <AchievementBadge type="champion" size="sm" unlocked />
                    <AchievementBadge type="champion" size="md" unlocked />
                    <AchievementBadge type="champion" size="lg" unlocked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="celebrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Progress Celebrations</CardTitle>
                <CardDescription>Animated celebrations with confetti effects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button onClick={() => triggerCelebration('task')}>
                    Task Complete
                  </Button>
                  <Button onClick={() => triggerCelebration('day')}>
                    Day Complete
                  </Button>
                  <Button onClick={() => triggerCelebration('milestone')}>
                    Milestone Reached
                  </Button>
                  <Button onClick={() => triggerCelebration('complete')}>
                    75 Hard Complete!
                  </Button>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Click any button above to trigger a celebration animation.
                    Different celebration types have different confetti effects and durations.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress Sharing</CardTitle>
                <CardDescription>Share your progress on social media</CardDescription>
              </CardHeader>
              <CardContent>
                <ProgressShare stats={sampleStats} userName="Test User" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="themes" className="space-y-6">
            <ThemeSelector />
            
            <Card>
              <CardHeader>
                <CardTitle>Theme Preview</CardTitle>
                <CardDescription>See how different themes affect progress elements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ProgressRing value={75} label="Themed Ring" />
                  <ProgressBar value={75} label="Themed Bar" showValue />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {celebrationType && (
          <ProgressCelebration
            show={showCelebration}
            type={celebrationType}
            message={{
              task: "Task completed! Keep it up!",
              day: "Day 42 complete! You're crushing it!",
              milestone: "30 Day Milestone Reached!",
              complete: "75 HARD COMPLETE!"
            }[celebrationType]}
            onComplete={() => setShowCelebration(false)}
          />
        )}
      </div>
    </ProgressThemeProvider>
  )
}