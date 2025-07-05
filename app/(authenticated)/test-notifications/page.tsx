"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  createTaskCompletionNotification, 
  createStreakNotification,
  createDailyReminderNotification
} from '@/lib/utils/notification-triggers'
import { inAppNotificationService } from '@/lib/services/in-app-notification-service'
import { getNotificationService } from '@/lib/services/notification-service'
import { Bell, Droplets, Dumbbell, Calendar, Trophy, Zap } from 'lucide-react'

export default function TestNotificationsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [pushEnabled, setPushEnabled] = useState(false)

  // Check push notification status on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const notificationService = getNotificationService()
      setPushEnabled(notificationService.getPermissionStatus() === 'granted')
    }
  }, [])

  const testInAppNotifications = async () => {
    setLoading('in-app')
    try {
      // Test different notification types
      await createTaskCompletionNotification('First Workout')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await createStreakNotification(7)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await createDailyReminderNotification(['Second workout', 'Read 10 pages'])
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await inAppNotificationService.createNotification({
        title: 'Test System Notification',
        description: 'This is a test of the system notification type',
        type: 'system'
      })
      
      toast.success('In-app notifications created!')
    } catch (error) {
      toast.error('Error creating in-app notifications')
      console.error(error)
    } finally {
      setLoading(null)
    }
  }

  const testPushNotification = async (type: string) => {
    setLoading(type)
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })

      if (!response.ok) {
        throw new Error('Failed to send test notification')
      }

      toast.success('Push notification sent! Check your device.')
    } catch (error) {
      toast.error('Error sending push notification')
      console.error(error)
    } finally {
      setLoading(null)
    }
  }

  const enablePushNotifications = async () => {
    try {
      // Check if we're in a PWA context
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator as any).standalone === true
      
      if (!isPWA) {
        toast.error('Please add this app to your home screen first to enable push notifications')
        return
      }

      // Check if service worker is registered
      if (!('serviceWorker' in navigator)) {
        toast.error('Service workers not supported on this device')
        return
      }

      const registration = await navigator.serviceWorker.ready
      console.log('Service worker ready:', registration)

      // Check if push manager is available
      if (!('pushManager' in registration)) {
        toast.error('Push notifications not supported on this device')
        return
      }

      const notificationService = getNotificationService()
      const permission = await notificationService.requestPermission()
      
      if (permission === 'granted') {
        setPushEnabled(true)
        toast.success('Push notifications enabled!')
      } else if (permission === 'denied') {
        toast.error('Push notifications permission denied. Please enable in Settings.')
      } else {
        toast.error('Push notifications permission not granted')
      }
    } catch (error) {
      console.error('Push notification error:', error)
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Check PWA status
  const isPWA = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as any).standalone === true
  )

  return (
    <div className="container px-4 md:px-6 py-6 md:py-8 max-w-4xl space-y-6">
      {/* PWA Installation Notice */}
      {!isPWA && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900">Install App First</CardTitle>
            <CardDescription className="text-amber-700">
              To enable push notifications on iOS:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-amber-700">
            <ol className="list-decimal list-inside space-y-1">
              <li>Tap the Share button in Safari</li>
              <li>Select "Add to Home Screen"</li>
              <li>Open the app from your home screen</li>
              <li>Then enable notifications</li>
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Push Notification Permission */}
      {!pushEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Enable Push Notifications
            </CardTitle>
            <CardDescription>
              Allow push notifications to receive reminders even when the app is closed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={enablePushNotifications} className="w-full">
              Enable Push Notifications
            </Button>
          </CardContent>
        </Card>
      )}

      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>In-App Notifications</CardTitle>
          <CardDescription>
            Test notifications that appear within the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testInAppNotifications} 
            disabled={loading === 'in-app'}
            className="w-full"
          >
            {loading === 'in-app' ? 'Creating notifications...' : 'Create In-App Notifications'}
          </Button>
          
          <p className="text-sm text-muted-foreground">
            This will create several test notifications in the app. 
            Check the notifications bell icon to see them.
          </p>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      {pushEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Push Notifications</CardTitle>
            <CardDescription>
              Test push notifications that appear on your device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Button 
                onClick={() => testPushNotification('daily')}
                disabled={loading === 'daily'}
                variant="outline"
                className="justify-start"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {loading === 'daily' ? 'Sending...' : 'Daily Reminder'}
              </Button>
              
              <Button 
                onClick={() => testPushNotification('workout')}
                disabled={loading === 'workout'}
                variant="outline"
                className="justify-start"
              >
                <Dumbbell className="h-4 w-4 mr-2" />
                {loading === 'workout' ? 'Sending...' : 'Workout Reminder'}
              </Button>
              
              <Button 
                onClick={() => testPushNotification('water')}
                disabled={loading === 'water'}
                variant="outline"
                className="justify-start"
              >
                <Droplets className="h-4 w-4 mr-2" />
                {loading === 'water' ? 'Sending...' : 'Water Reminder'}
              </Button>
              
              <Button 
                onClick={() => testPushNotification('achievement')}
                disabled={loading === 'achievement'}
                variant="outline"
                className="justify-start"
              >
                <Trophy className="h-4 w-4 mr-2" />
                {loading === 'achievement' ? 'Sending...' : 'Achievement Alert'}
              </Button>
              
              <Button 
                onClick={() => testPushNotification('streak')}
                disabled={loading === 'streak'}
                variant="outline"
                className="justify-start"
              >
                <Zap className="h-4 w-4 mr-2" />
                {loading === 'streak' ? 'Sending...' : 'Streak Alert'}
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Push notifications will appear on your device even when the app is closed.
              Make sure you've allowed notifications in your device settings.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}