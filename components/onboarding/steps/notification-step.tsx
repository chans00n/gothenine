"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Bell, BellOff, CheckCircle2 } from 'lucide-react'
import { getNotificationService } from '@/lib/services/notification-service'
import type { OnboardingData } from '../onboarding-flow'

interface NotificationStepProps {
  data: Partial<OnboardingData>
  updateData: (data: Partial<OnboardingData>) => void
  onNext: () => void
}

export function NotificationStep({ data, updateData }: NotificationStepProps) {
  const [isRequesting, setIsRequesting] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    // Check notification support on client side
    if (typeof window !== 'undefined') {
      const service = getNotificationService()
      setIsSupported(service.isNotificationSupported())
      setPermission(service.getPermissionStatus())
    }
  }, [])

  const handleEnableNotifications = async () => {
    setIsRequesting(true)
    try {
      const notificationService = getNotificationService()
      const result = await notificationService.requestPermission()
      setPermission(result)
      if (result === 'granted') {
        updateData({ notificationsEnabled: true })
      }
    } catch (error) {
      console.error('Failed to request permission:', error)
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
          <Bell className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold">Stay on Track</h2>
        <p className="text-muted-foreground">
          Get helpful reminders to complete your daily tasks
        </p>
      </div>

      {!isSupported ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <BellOff className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <p className="font-medium">Notifications not supported</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your browser doesn't support notifications
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className={permission === 'granted' ? 'border-green-600/20' : ''}>
            <CardHeader>
              <CardTitle>Enable Notifications</CardTitle>
              <CardDescription>
                We'll remind you about workouts, water intake, and more
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {permission === 'granted' ? (
                <div className="flex items-center gap-3 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Notifications enabled!</span>
                </div>
              ) : permission === 'denied' ? (
                <div className="space-y-3">
                  <p className="text-sm text-destructive">
                    Notifications are blocked. Please enable them in your browser settings.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => updateData({ notificationsEnabled: false })}
                  >
                    Continue without notifications
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleEnableNotifications}
                  disabled={isRequesting}
                  className="w-full"
                >
                  {isRequesting ? 'Requesting...' : 'Enable Notifications'}
                </Button>
              )}
            </CardContent>
          </Card>

          <div className="space-y-3">
            <p className="text-sm font-medium">You'll get reminders for:</p>
            <div className="grid gap-2">
              {[
                'Daily check-in at 6:00 AM',
                'Workout reminders at 7:00 AM & 5:00 PM',
                'Water intake every 2 hours',
                'Reading time at 8:00 PM',
                'Progress photo at 7:30 AM'
              ].map((reminder, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  {reminder}
                </div>
              ))}
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="skip-notifications" className="cursor-pointer">
                  Skip for now
                </Label>
                <Switch
                  id="skip-notifications"
                  checked={!data.notificationsEnabled}
                  onCheckedChange={(checked) => updateData({ notificationsEnabled: !checked })}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                You can always enable notifications later in settings
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}