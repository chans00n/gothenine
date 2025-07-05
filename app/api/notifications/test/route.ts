import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getPushNotificationService } from '@/lib/services/push-notification-service'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the test type from request
    const { type } = await request.json()
    const pushService = getPushNotificationService()

    switch (type) {
      case 'daily':
        await pushService.sendToUser(user.id, {
          title: '75 Hard Daily Check-in',
          body: 'Time to complete your daily tasks! 💪',
          tag: 'daily',
          data: { type: 'daily' },
          actions: [
            { action: 'open-checklist', title: 'Open Checklist' },
            { action: 'dismiss', title: 'Dismiss' }
          ]
        })
        break

      case 'workout':
        await pushService.sendToUser(user.id, {
          title: 'Workout Reminder',
          body: 'Time for your workout! 🏋️',
          tag: 'workout',
          data: { type: 'workout' },
          actions: [
            { action: 'start-timer', title: 'Start Timer' },
            { action: 'mark-complete', title: 'Mark Complete' }
          ]
        })
        break

      case 'water':
        await pushService.sendToUser(user.id, {
          title: 'Water Reminder 💧',
          body: 'Time to drink water! Stay hydrated!',
          tag: 'water',
          data: { type: 'water' },
          actions: [
            { action: 'log-water', title: 'Log Water' },
            { action: 'snooze', title: 'Remind Later' }
          ]
        })
        break

      case 'achievement':
        await pushService.sendAchievementNotification(user.id, {
          title: 'Test Achievement',
          description: 'This is a test achievement notification!'
        })
        break

      case 'streak':
        await pushService.sendStreakNotification(user.id, 7)
        break

      default:
        await pushService.sendToUser(user.id, {
          title: 'Test Notification',
          body: 'This is a test push notification from 75 Hard Tracker!'
        })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Test notification sent'
    })
  } catch (error) {
    console.error('Test notification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}