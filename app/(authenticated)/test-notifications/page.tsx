"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  createTaskCompletionNotification, 
  createStreakNotification,
  createDailyReminderNotification
} from '@/lib/utils/notification-triggers'
import { inAppNotificationService } from '@/lib/services/in-app-notification-service'

export default function TestNotificationsPage() {
  const [loading, setLoading] = useState(false)

  const testNotifications = async () => {
    setLoading(true)
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
      
      toast.success('Test notifications created!')
    } catch (error) {
      toast.error('Error creating test notifications')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container px-4 md:px-6 py-6 md:py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Notifications</CardTitle>
          <CardDescription>
            Create test notifications to verify the notification system is working properly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testNotifications} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating notifications...' : 'Create Test Notifications'}
          </Button>
          
          <p className="text-sm text-muted-foreground">
            This will create several test notifications of different types. 
            Check the notifications page to see them.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}