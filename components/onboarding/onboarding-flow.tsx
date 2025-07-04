"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { WelcomeStep } from './steps/welcome-step'
import { RulesStep } from './steps/rules-step'
import { ProfileStep } from './steps/profile-step'
import { TimezoneStep } from './steps/timezone-step'
import { NotificationStep } from './steps/notification-step'
import { ReadyStep } from './steps/ready-step'

export interface OnboardingData {
  displayName: string
  timezone: string
  notificationsEnabled: boolean
  notificationPreferences: {
    dailyReminderTime: string
    workoutReminderTimes: string[]
    waterReminderInterval: number
    readingReminderTime: string
    photoReminderTime: string
  }
}

const steps = [
  { id: 'welcome', title: 'Welcome', component: WelcomeStep },
  { id: 'rules', title: 'The Rules', component: RulesStep },
  { id: 'profile', title: 'Your Profile', component: ProfileStep },
  { id: 'timezone', title: 'Time Zone', component: TimezoneStep },
  { id: 'notifications', title: 'Notifications', component: NotificationStep },
  { id: 'ready', title: 'Get Started', component: ReadyStep }
]

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<Partial<OnboardingData>>({
    displayName: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notificationsEnabled: false,
    notificationPreferences: {
      dailyReminderTime: '06:00',
      workoutReminderTimes: ['07:00', '17:00'],
      waterReminderInterval: 2,
      readingReminderTime: '20:00',
      photoReminderTime: '07:30'
    }
  })

  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Complete onboarding
      onComplete(data as OnboardingData)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const CurrentStepComponent = steps[currentStep].component
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress Bar */}
      <div className="w-full px-4 pt-8">
        <div className="max-w-2xl mx-auto">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CurrentStepComponent
                data={data}
                updateData={updateData}
                onNext={handleNext}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="w-full px-4 pb-8">
        <div className="max-w-2xl mx-auto flex justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={isFirstStep}
            className={isFirstStep ? 'invisible' : ''}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Button onClick={handleNext}>
            {isLastStep ? 'Start Challenge' : 'Next'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}