import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPushNotificationService } from '@/lib/services/push-notification-service'

// This runs every minute to check for notifications
export async function GET() {
  try {
    // Verify the request is from Vercel Cron
    const headersList = headers()
    const authHeader = headersList.get('authorization')
    
    // In production, verify the cron secret
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notificationService = getPushNotificationService()
    const now = new Date()
    const currentMinute = now.getMinutes()
    
    // Log for debugging
    console.log(`Cron job running at ${now.toISOString()}`)

    // Run different notification checks based on the current time
    const promises: Promise<void>[] = []

    // Daily reminders - check every minute for users whose time matches
    promises.push(notificationService.sendDailyReminders())

    // Workout reminders - check for both workout times
    promises.push(notificationService.sendWorkoutReminders(1))
    promises.push(notificationService.sendWorkoutReminders(2))

    // Reading reminders
    promises.push(notificationService.sendReadingReminders())

    // Photo reminders
    promises.push(notificationService.sendPhotoReminders())

    // Water reminders - only check every 15 minutes to reduce load
    if (currentMinute % 15 === 0) {
      promises.push(notificationService.sendWaterReminders())
    }

    // Wait for all notifications to be processed
    await Promise.allSettled(promises)

    return NextResponse.json({ 
      success: true, 
      timestamp: now.toISOString(),
      notifications: {
        daily: true,
        workout: true,
        reading: true,
        photo: true,
        water: currentMinute % 15 === 0
      }
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}