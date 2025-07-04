import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Target, Calendar, TrendingUp } from 'lucide-react'
import type { OnboardingData } from '../onboarding-flow'

interface ReadyStepProps {
  data: Partial<OnboardingData>
  updateData: (data: Partial<OnboardingData>) => void
  onNext: () => void
}

export function ReadyStep({ data }: ReadyStepProps) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="text-4xl font-bold">You're All Set!</h2>
        <p className="text-xl text-muted-foreground">
          {data.displayName ? `${data.displayName}, you're` : "You're"} ready to begin your Go the Nine journey
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <Target className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Day 1 Starts Now</h3>
            <p className="text-sm text-muted-foreground">
              Complete all 5 tasks before midnight
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Calendar className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Track Daily</h3>
            <p className="text-sm text-muted-foreground">
              Check off tasks as you complete them
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium mb-1">Pro Tip</p>
              <p className="text-sm text-muted-foreground">
                Start with your outdoor workout early in the day. It sets a positive tone and ensures weather won't be an excuse later.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Remember: This is a mental toughness challenge
        </p>
        <p className="font-medium">
          No compromises. No substitutions. No excuses.
        </p>
      </div>
    </div>
  )
}