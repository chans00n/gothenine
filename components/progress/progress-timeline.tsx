"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle2, XCircle, Trophy, Target, TrendingUp, Camera, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface TimelineEvent {
  date: string
  dayNumber: number
  type: 'complete' | 'incomplete' | 'milestone' | 'photo' | 'note'
  title: string
  description?: string
  icon: any
  color: string
}

interface ProgressTimelineProps {
  data: {
    dailyProgress: Array<{
      date: string
      dayNumber: number
      isComplete: boolean
      tasksCompleted: number
      completionRate: number
      notes?: string
      hasPhoto?: boolean
    }>
    milestones: Array<{
      day: number
      reached: boolean
      date?: string
    }>
  }
  timezone: string
}

export function ProgressTimeline({ data, timezone }: ProgressTimelineProps) {
  // Create timeline events from daily progress and milestones
  const events: TimelineEvent[] = []

  // Add daily progress events
  data.dailyProgress.forEach(day => {
    if (day.isComplete) {
      events.push({
        date: day.date,
        dayNumber: day.dayNumber,
        type: 'complete',
        title: `Day ${day.dayNumber} Complete`,
        description: `All 6 tasks completed (${day.completionRate}%)`,
        icon: CheckCircle2,
        color: 'text-green-600'
      })
    } else if (day.tasksCompleted > 0) {
      events.push({
        date: day.date,
        dayNumber: day.dayNumber,
        type: 'incomplete',
        title: `Day ${day.dayNumber} Partial`,
        description: `${day.tasksCompleted} of 6 tasks completed`,
        icon: XCircle,
        color: 'text-yellow-600'
      })
    }

    if (day.hasPhoto) {
      events.push({
        date: day.date,
        dayNumber: day.dayNumber,
        type: 'photo',
        title: 'Progress Photo',
        description: 'Photo captured',
        icon: Camera,
        color: 'text-blue-600'
      })
    }

    if (day.notes) {
      events.push({
        date: day.date,
        dayNumber: day.dayNumber,
        type: 'note',
        title: 'Daily Note',
        description: day.notes.substring(0, 100) + (day.notes.length > 100 ? '...' : ''),
        icon: FileText,
        color: 'text-purple-600'
      })
    }
  })

  // Add milestone events
  const milestoneIcons: Record<number, any> = {
    7: Target,
    14: TrendingUp,
    21: Target,
    30: Trophy,
    40: TrendingUp,
    50: Target,
    60: TrendingUp,
    70: Target,
    75: Trophy
  }

  data.milestones.forEach(milestone => {
    if (milestone.reached && milestone.date) {
      events.push({
        date: milestone.date,
        dayNumber: milestone.day,
        type: 'milestone',
        title: `${milestone.day} Day Milestone`,
        description: getMilestoneDescription(milestone.day),
        icon: milestoneIcons[milestone.day] || Trophy,
        color: 'text-orange-600'
      })
    }
  })

  // Sort events by date (newest first)
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Group events by date
  const groupedEvents: Record<string, TimelineEvent[]> = {}
  events.forEach(event => {
    if (!groupedEvents[event.date]) {
      groupedEvents[event.date] = []
    }
    groupedEvents[event.date].push(event)
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Timeline</CardTitle>
        <CardDescription>
          Your journey through 75 Hard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-9 top-0 bottom-0 w-0.5 bg-border" />

            {/* Timeline events */}
            <div className="space-y-8">
              {Object.entries(groupedEvents).map(([date, dateEvents], dateIndex) => (
                <div key={date} className="relative">
                  {/* Date header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-4 h-4 rounded-full bg-background border-2 border-primary" />
                    <div>
                      <p className="font-medium">
                        {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Day {dateEvents[0].dayNumber} of 75
                      </p>
                    </div>
                  </div>

                  {/* Events for this date */}
                  <div className="ml-9 space-y-3">
                    {dateEvents.map((event, eventIndex) => {
                      const Icon = event.icon
                      return (
                        <div
                          key={`${event.type}-${eventIndex}`}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-lg",
                            event.type === 'complete' && "bg-green-50 dark:bg-green-950/20",
                            event.type === 'incomplete' && "bg-yellow-50 dark:bg-yellow-950/20",
                            event.type === 'milestone' && "bg-orange-50 dark:bg-orange-950/20",
                            event.type === 'photo' && "bg-blue-50 dark:bg-blue-950/20",
                            event.type === 'note' && "bg-purple-50 dark:bg-purple-950/20"
                          )}
                        >
                          <Icon className={cn("h-5 w-5 mt-0.5", event.color)} />
                          <div className="flex-1 space-y-1">
                            <p className="font-medium text-sm">{event.title}</p>
                            {event.description && (
                              <p className="text-sm text-muted-foreground">
                                {event.description}
                              </p>
                            )}
                          </div>
                          {event.type === 'milestone' && (
                            <Badge variant="secondary" className="ml-auto">
                              Milestone
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function getMilestoneDescription(day: number): string {
  const descriptions: Record<number, string> = {
    7: "One week of dedication!",
    14: "Two weeks strong!",
    21: "Three weeks - habit forming!",
    30: "One month milestone!",
    40: "More than halfway there!",
    50: "50 days of commitment!",
    60: "Final stretch begins!",
    70: "Almost there!",
    75: "75 Hard Champion!"
  }
  return descriptions[day] || `${day} days complete!`
}