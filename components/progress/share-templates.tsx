"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface ShareTemplate {
  id: string
  title: string
  template: string
  tags: string[]
}

interface ShareTemplatesProps {
  stats: {
    daysComplete: number
    currentStreak: number
    completionRate: number
    totalWorkouts: number
    bestStreak: number
  }
}

export function ShareTemplates({ stats }: ShareTemplatesProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const templates: ShareTemplate[] = [
    {
      id: 'motivation',
      title: 'Motivation Monday',
      template: `🔥 Day ${stats.daysComplete}/75 crushed! 

Current streak: ${stats.currentStreak} days
Completion rate: ${stats.completionRate}%

Every day is a choice. I choose discipline.
Who's with me? 💪

#75Hard #75HardChallenge #MondayMotivation`,
      tags: ['motivation', 'monday', 'weekly']
    },
    {
      id: 'milestone',
      title: 'Milestone Achievement',
      template: `🏆 MILESTONE UNLOCKED! Day ${stats.daysComplete} of 75 Hard complete!

✅ ${stats.totalWorkouts} total workouts
📈 ${stats.completionRate}% completion rate
🔥 ${stats.currentStreak} day streak

The only bad workout is the one that didn't happen.

#75Hard #75HardChallenge #ProgressNotPerfection`,
      tags: ['milestone', 'achievement', 'celebration']
    },
    {
      id: 'struggle',
      title: 'Overcoming Struggles',
      template: `Day ${stats.daysComplete} wasn't easy, but I showed up anyway. 

Some days you don't feel like it. 
Some days everything goes wrong.
Some days you question why you started.

But you do it anyway. That's what builds mental toughness.

Still going strong 💪

#75Hard #75HardChallenge #MentalToughness`,
      tags: ['struggle', 'perseverance', 'honest']
    },
    {
      id: 'accountability',
      title: 'Accountability Check',
      template: `📊 75 HARD ACCOUNTABILITY CHECK - Day ${stats.daysComplete}

✅ Two 45-min workouts
✅ Follow diet plan
✅ Drink 1 gallon of water
✅ Read 10 pages
✅ Take progress photo

Current streak: ${stats.currentStreak} days
Who else is checking in today? Drop a 💪 below!

#75Hard #75HardChallenge #AccountabilityPartner`,
      tags: ['accountability', 'daily', 'checkin']
    },
    {
      id: 'inspiration',
      title: 'Inspiring Others',
      template: `${stats.daysComplete} days ago, I made a decision to change my life.

Today, I'm ${stats.completionRate}% through the 75 Hard Challenge.

If you're thinking about starting:
- You're stronger than you think
- Perfect time doesn't exist
- Start today, thank yourself tomorrow

Your future self is waiting. 🚀

#75Hard #75HardChallenge #Inspiration`,
      tags: ['inspiration', 'motivation', 'journey']
    },
    {
      id: 'weekend',
      title: 'Weekend Warrior',
      template: `Weekend vibes but the grind doesn't stop! 🏃‍♂️

Day ${stats.daysComplete}/75 ✅
Streak: ${stats.currentStreak} days 🔥

Weekends test your commitment. While others sleep in, we rise and grind.

Who's getting after it this weekend?

#75Hard #75HardChallenge #WeekendWarrior #NoExcuses`,
      tags: ['weekend', 'saturday', 'sunday']
    }
  ]

  const handleCopy = async (template: ShareTemplate) => {
    try {
      await navigator.clipboard.writeText(template.template)
      setCopiedId(template.id)
      toast.success('Template copied to clipboard!')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      toast.error('Failed to copy template')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share Templates</CardTitle>
        <CardDescription>
          Pre-written templates for sharing your progress on social media
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">{template.title}</h4>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(template)}
                    className="h-8 w-8 p-0"
                  >
                    {copiedId === template.id ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-5">
                  {template.template}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}