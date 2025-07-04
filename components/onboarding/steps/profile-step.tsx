"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User } from 'lucide-react'
import type { OnboardingData } from '../onboarding-flow'

interface ProfileStepProps {
  data: Partial<OnboardingData>
  updateData: (data: Partial<OnboardingData>) => void
  onNext: () => void
}

export function ProfileStep({ data, updateData }: ProfileStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
          <User className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold">Create Your Profile</h2>
        <p className="text-muted-foreground">
          Let's personalize your experience
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
          <CardDescription>
            This helps us personalize your journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="Enter your name"
              value={data.displayName || ''}
              onChange={(e) => updateData({ displayName: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              This is how we'll greet you in the app
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          You can always update this later in your settings
        </p>
      </div>
    </div>
  )
}