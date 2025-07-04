import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import type { OnboardingData } from '../onboarding-flow'

interface RulesStepProps {
  data: Partial<OnboardingData>
  updateData: (data: Partial<OnboardingData>) => void
  onNext: () => void
}

const rules = [
  {
    title: "Two 45-minute workouts",
    description: "One must be outdoors. No rest days.",
    icon: "🏋️"
  },
  {
    title: "Follow a diet",
    description: "No cheat meals. No alcohol.",
    icon: "🥗"
  },
  {
    title: "Drink 1 gallon of water",
    description: "Plain water only. Track your intake.",
    icon: "💧"
  },
  {
    title: "Read 10 pages",
    description: "Non-fiction self-improvement book.",
    icon: "📚"
  },
  {
    title: "Take a progress photo",
    description: "Daily visual documentation.",
    icon: "📸"
  }
]

export function RulesStep({ onNext }: RulesStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">The 75 Hard Rules</h2>
        <p className="text-muted-foreground">
          Complete all 5 tasks every day for 75 days straight
        </p>
      </div>

      <div className="space-y-3">
        {rules.map((rule, index) => (
          <Card key={index}>
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="text-2xl">{rule.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{rule.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {rule.description}
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="pt-6">
          <p className="text-sm font-medium text-destructive">
            Important: If you miss any task, you must start over from Day 1
          </p>
        </CardContent>
      </Card>
    </div>
  )
}