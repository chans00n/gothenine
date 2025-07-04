import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Target, Brain, Users } from 'lucide-react'
import type { OnboardingData } from '../onboarding-flow'

interface WelcomeStepProps {
  data: Partial<OnboardingData>
  updateData: (data: Partial<OnboardingData>) => void
  onNext: () => void
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="space-y-8 text-center">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Welcome to 75 Hard Tracker
        </h1>
        <p className="text-xl text-muted-foreground">
          Your journey to mental toughness starts here
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <Trophy className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Track Progress</h3>
            <p className="text-sm text-muted-foreground">
              Monitor your daily tasks and celebrate milestones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Target className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Stay Accountable</h3>
            <p className="text-sm text-muted-foreground">
              Get reminders and track your streak
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Brain className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Build Discipline</h3>
            <p className="text-sm text-muted-foreground">
              Develop mental toughness through consistency
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Users className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Share Journey</h3>
            <p className="text-sm text-muted-foreground">
              Inspire others with your progress
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        Let's get you set up in just a few minutes
      </p>
    </div>
  )
}