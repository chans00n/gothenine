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
import { Bell, Droplets, Dumbbell, Calendar, Trophy, Zap, Bug, RefreshCw } from 'lucide-react'

export default function TestNotificationsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [swStatus, setSwStatus] = useState<string>('Checking...')
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)

  // Check push notification status on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const notificationService = getNotificationService()
      setPushEnabled(notificationService.getPermissionStatus() === 'granted')
      checkServiceWorker()
    }
  }, [])

  const checkServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      setSwStatus('Not supported')
      return
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      console.log('Service worker registrations found:', registrations.length)
      
      if (registrations.length > 0) {
        setSwStatus(`Registered (${registrations.length})`)
        setSwRegistration(registrations[0]) // Store the first registration
        // Also update the UI to reflect we can now enable push
        const notificationService = getNotificationService()
        setPushEnabled(notificationService.getPermissionStatus() === 'granted')
      } else {
        setSwStatus('Not registered')
        setSwRegistration(null)
      }
    } catch (error) {
      console.error('Error checking service worker:', error)
      setSwStatus('Error checking')
    }
  }

  const registerServiceWorker = async () => {
    try {
      console.log('Manually registering service worker...')
      setLoading('sw-register')
      
      if (!('serviceWorker' in navigator)) {
        toast.error('Service workers not supported')
        return
      }

      // Register the service worker - using simple one for iOS testing
      const registration = await navigator.serviceWorker.register('/simple-sw.js', {
        scope: '/'
      })
      
      console.log('Service worker registered:', registration)
      
      // Store the registration immediately
      setSwRegistration(registration)
      
      // If there's an active worker, we're good
      if (registration.active) {
        console.log('Service worker is already active')
      } else if (registration.installing || registration.waiting) {
        console.log('Service worker is installing/waiting, triggering skipWaiting...')
        
        // Send skip waiting message to service worker
        const worker = registration.installing || registration.waiting
        worker?.postMessage({ type: 'SKIP_WAITING' })
      }
      
      // Don't wait for ready - just check if it registered
      toast.success('Service worker registered successfully!')
      await checkServiceWorker()
      
      // Force a small delay to ensure registration is complete
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Service worker registration error:', error)
      toast.error('Failed to register service worker')
    } finally {
      setLoading(null)
    }
  }

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
    console.log('Enable push notifications clicked')
    setLoading('push-setup')
    
    try {
      // Check if we're in a PWA context
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator as any).standalone === true
      
      console.log('PWA check:', isPWA)
      
      if (!isPWA) {
        toast.error('Please add this app to your home screen first to enable push notifications')
        return
      }

      // Check if service worker is registered
      console.log('Checking service worker support...')
      if (!('serviceWorker' in navigator)) {
        toast.error('Service workers not supported on this device')
        setLoading(null)
        return
      }
      console.log('Service worker supported')
      
      // Get the service worker registration
      console.log('Getting service worker registration...')
      
      let registration
      
      // First, check if we have a stored registration
      if (swRegistration) {
        console.log('Using stored registration:', swRegistration)
        registration = swRegistration
      } else {
        try {
          // Try to get the ready registration with a shorter timeout
          const registrationPromise = navigator.serviceWorker.ready
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Service worker timeout')), 5000)
          )
          
          registration = await Promise.race([registrationPromise, timeoutPromise]) as ServiceWorkerRegistration
          console.log('Service worker ready:', registration)
        } catch (timeoutError) {
          console.log('Service worker ready timed out, getting registrations manually...')
          
          // Fallback: get the first registration
          const registrations = await navigator.serviceWorker.getRegistrations()
          if (registrations.length > 0) {
            registration = registrations[0]
            console.log('Using first registration:', registration)
          } else {
            console.error('No service worker registrations found')
            toast.error('No service worker found. Please register it first.')
            setLoading(null)
            return
          }
        }
      }

      // Check if push manager is available
      if (!('pushManager' in registration)) {
        toast.error('Push notifications not supported on this device')
        return
      }

      // Check current permission
      const currentPermission = Notification.permission
      console.log('Current permission:', currentPermission)
      
      if (currentPermission === 'granted') {
        // Permission already granted, just subscribe
        await subscribeToPushNotifications(registration)
      } else if (currentPermission === 'denied') {
        toast.error('Push notifications are blocked. Please enable in iOS Settings > Notifications > Safari/Your App')
        return
      } else {
        // Request permission
        const permission = await Notification.requestPermission()
        console.log('Permission result:', permission)
        
        if (permission === 'granted') {
          await subscribeToPushNotifications(registration)
        } else {
          toast.error('Push notification permission denied')
          return
        }
      }
      
      setPushEnabled(true)
    } catch (error) {
      console.error('Push notification error:', error)
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(null)
    }
  }

  const subscribeToPushNotifications = async (registration: ServiceWorkerRegistration) => {
    try {
      // Wait for service worker to be active
      if (!registration.active) {
        console.log('Waiting for service worker to activate...')
        
        // Wait for the service worker to become active
        await new Promise<void>((resolve) => {
          if (registration.active) {
            resolve()
            return
          }
          
          // Listen for state changes
          const stateChangeHandler = () => {
            if (registration.active) {
              console.log('Service worker is now active')
              registration.installing?.removeEventListener('statechange', stateChangeHandler)
              registration.waiting?.removeEventListener('statechange', stateChangeHandler)
              resolve()
            }
          }
          
          if (registration.installing) {
            console.log('Service worker is installing...')
            registration.installing.addEventListener('statechange', stateChangeHandler)
          }
          if (registration.waiting) {
            console.log('Service worker is waiting...')
            registration.waiting.addEventListener('statechange', stateChangeHandler)
          }
          
          // Timeout after 10 seconds
          setTimeout(() => {
            console.error('Service worker activation timeout')
            resolve() // Resolve anyway to try
          }, 10000)
        })
      }
      
      console.log('Service worker state:', {
        active: !!registration.active,
        waiting: !!registration.waiting,
        installing: !!registration.installing
      })
      
      console.log('Checking for existing subscription...')
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        console.log('Found existing subscription:', subscription.endpoint)
        toast.info('Found existing subscription, updating server...')
      } else {
        console.log('No existing subscription, creating new one...')
        
        // Subscribe with VAPID public key
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidPublicKey) {
          throw new Error('VAPID public key not configured')
        }
        
        console.log('VAPID key found, subscribing...')
        
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          })
          console.log('Subscription created:', subscription.endpoint)
        } catch (subError) {
          console.error('Subscribe error:', subError)
          if ((subError as any).code === 0) {
            toast.error('Push notifications not supported on this device. Make sure you are using Safari 16.4+ on iOS.')
          }
          throw subError
        }
      }
      
      // Send subscription to server
      console.log('Sending subscription to server...')
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription.toJSON())
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server response error:', errorText)
        throw new Error('Failed to save subscription on server: ' + errorText)
      }
      
      console.log('Subscription saved successfully')
      toast.success('Push notifications subscribed successfully!')
      
      // Refresh debug info if it's showing
      if (showDebug) {
        await fetchDebugInfo()
      }
    } catch (error) {
      console.error('Push subscription error:', error)
      throw error
    }
  }

  // Helper function to convert VAPID key
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Check PWA status
  const isPWA = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as any).standalone === true
  )

  const fetchDebugInfo = async () => {
    setLoading('debug')
    try {
      const response = await fetch('/api/notifications/debug')
      const data = await response.json()
      setDebugInfo(data)
      setShowDebug(true)
    } catch (error) {
      toast.error('Failed to fetch debug info')
    } finally {
      setLoading(null)
    }
  }

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notification Setup
          </CardTitle>
          <CardDescription>
            {pushEnabled ? 'Push notifications are enabled' : 'Setup push notifications to receive reminders'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-1">
            <p>Current Permission: <strong>{typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'Not supported'}</strong></p>
            <p>PWA Mode: <strong>{isPWA ? 'Yes ✅' : 'No ❌'}</strong></p>
            <div className="flex items-center justify-between">
              <p>Service Worker: <strong>{swStatus}</strong></p>
              <Button
                size="sm"
                variant="ghost"
                onClick={checkServiceWorker}
                className="h-6 px-2"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {swStatus === 'Not registered' && (
            <Button 
              onClick={registerServiceWorker}
              variant="outline"
              className="w-full"
              disabled={loading === 'sw-register'}
            >
              {loading === 'sw-register' ? 'Registering...' : 'Register Service Worker'}
            </Button>
          )}
          
          <Button 
            onClick={enablePushNotifications} 
            className="w-full"
            disabled={loading === 'push-setup'}
          >
            {loading === 'push-setup' ? 'Setting up...' : (pushEnabled ? 'Re-subscribe to Push Notifications' : 'Enable Push Notifications')}
          </Button>
          
          {!isPWA && (
            <p className="text-xs text-amber-600">
              ⚠️ You must add this app to your home screen first
            </p>
          )}
        </CardContent>
      </Card>

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

      {/* Debug Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Debug Information
          </CardTitle>
          <CardDescription>
            Check your notification setup status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={fetchDebugInfo}
            disabled={loading === 'debug'}
            variant="outline"
            className="w-full"
          >
            {loading === 'debug' ? 'Loading...' : 'Fetch Debug Info'}
          </Button>
          
          {showDebug && debugInfo && (
            <div className="space-y-4 text-sm">
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium">Push Subscriptions</h4>
                <p>Count: {debugInfo.subscriptions.count}</p>
                {debugInfo.subscriptions.count === 0 && (
                  <p className="text-amber-600">⚠️ No push subscriptions found! You need to enable notifications first.</p>
                )}
                {debugInfo.subscriptions.data && debugInfo.subscriptions.data.map((sub: any, i: number) => (
                  <div key={i} className="text-xs text-muted-foreground">
                    <p>Endpoint: {sub.endpoint.substring(0, 50)}...</p>
                    <p>Created: {new Date(sub.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium">Notification Preferences</h4>
                {debugInfo.preferences.data ? (
                  <>
                    <p>Enabled: {debugInfo.preferences.data.enabled ? '✅' : '❌'}</p>
                    <p>Daily Reminders: {debugInfo.preferences.data.daily_reminder ? '✅' : '❌'}</p>
                  </>
                ) : (
                  <p className="text-amber-600">⚠️ No preferences found</p>
                )}
              </div>
              
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium">Environment</h4>
                <p>VAPID Public Key: {debugInfo.environment.hasVapidPublicKey ? '✅' : '❌'}</p>
                <p>VAPID Private Key: {debugInfo.environment.hasVapidPrivateKey ? '✅' : '❌'}</p>
                <p>Service Role Key: {debugInfo.environment.hasServiceRoleKey ? '✅' : '❌'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}