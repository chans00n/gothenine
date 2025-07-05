"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Bell, BellOff, CheckCircle2, X } from 'lucide-react'

interface NotificationPermissionProps {
  onPermissionGranted?: () => void
  onPermissionDenied?: () => void
  showInline?: boolean
}

export function NotificationPermission({ 
  onPermissionGranted, 
  onPermissionDenied,
  showInline = false 
}: NotificationPermissionProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isRequesting, setIsRequesting] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Mark as client-side
    setIsClient(true)
    
    // Check notification support and permission on client only
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }

    // Check if user has previously dismissed
    const dismissed = localStorage.getItem('75hard-notification-dismissed')
    if (dismissed === 'true') {
      setIsDismissed(true)
    } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      // Show banner with a slight delay for better UX
      setTimeout(() => setIsVisible(true), 500)
    }
  }, [])

  const handleRequestPermission = async () => {
    setIsRequesting(true)
    setError(null)

    try {
      if (!('Notification' in window)) {
        throw new Error('Notifications not supported')
      }

      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === 'granted') {
        // Subscribe to push notifications
        try {
          const registration = await navigator.serviceWorker.ready
          
          // Check if already subscribed
          let subscription = await registration.pushManager.getSubscription()
          
          if (!subscription) {
            // Subscribe with VAPID public key
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            if (!vapidPublicKey) {
              throw new Error('VAPID public key not configured')
            }
            
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            })
          }
          
          // Send subscription to server
          const response = await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscription.toJSON())
          })
          
          if (!response.ok) {
            throw new Error('Failed to save subscription on server')
          }
          
          console.log('Push subscription successful')
        } catch (pushError) {
          console.error('Push subscription error:', pushError)
          // Don't fail the whole process if push subscription fails
        }
        
        onPermissionGranted?.()
        // Remove dismissed state
        localStorage.removeItem('75hard-notification-dismissed')
        setIsVisible(false)
      } else if (result === 'denied') {
        onPermissionDenied?.()
      }
    } catch (err) {
      setError('Failed to request notification permission')
      console.error('Permission request error:', err)
    } finally {
      setIsRequesting(false)
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

  const handleDismiss = () => {
    setIsDismissed(true)
    setIsVisible(false)
    localStorage.setItem('75hard-notification-dismissed', 'true')
  }

  // Don't render until we're on the client
  if (!isClient) {
    return null
  }

  // Don't show if not supported
  if (!('Notification' in window)) {
    return null
  }

  // Don't show if already granted or dismissed
  if (permission === 'granted' || (isDismissed && permission === 'default')) {
    return null
  }

  // Inline version for settings page
  if (showInline) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Push Notifications</p>
            <p className="text-sm text-muted-foreground">
              {permission === 'granted' ? 'Enabled' : permission === 'denied' ? 'Blocked' : 'Not enabled'}
            </p>
          </div>
          {permission === 'default' && (
            <Button 
              onClick={handleRequestPermission}
              disabled={isRequesting}
              size="sm"
            >
              Enable
            </Button>
          )}
          {permission === 'denied' && (
            <p className="text-sm text-muted-foreground">
              Please enable in browser settings
            </p>
          )}
          {permission === 'granted' && (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          )}
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  // Banner version for main app - with simple fade transition
  return (
    <>
      {permission === 'default' && !isDismissed && (
        <div 
          className={`fixed top-4 left-4 right-4 z-50 max-w-lg mx-auto transition-all duration-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
        >
          <Card className="shadow-lg border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Enable Notifications</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      Get reminders for your daily tasks
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                    Daily check-in reminders
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                    Workout and water reminders
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                    Achievement celebrations
                  </li>
                </ul>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleRequestPermission}
                    disabled={isRequesting}
                    size="sm"
                    className="flex-1"
                  >
                    {isRequesting ? 'Requesting...' : 'Enable Notifications'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDismiss}
                  >
                    Not Now
                  </Button>
                </div>

                {permission === 'denied' && (
                  <Alert>
                    <BellOff className="h-4 w-4" />
                    <AlertDescription>
                      Notifications are blocked. Please enable them in your browser settings.
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}