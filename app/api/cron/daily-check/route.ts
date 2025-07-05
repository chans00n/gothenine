import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getPushNotificationService } from '@/lib/services/push-notification-service'

// This runs once daily to send all scheduled notifications and check streaks
// Modified to work within Vercel Hobby plan limits (1 run per day)
export async function GET() {
  try {
    // Verify the request is from Vercel Cron
    const headersList = headers()
    const authHeader = headersList.get('authorization')
    
    // In production, verify the cron secret
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const notificationService = getPushNotificationService()
    const now = new Date()
    
    console.log(`Daily cron job running at ${now.toISOString()}`)

    // Since we can only run once per day on Hobby plan, we'll send daily reminders
    // for users whose reminder time is around noon (when this runs)
    const currentHour = now.getHours()
    const notifications: Promise<void>[] = []

    // 1. Send daily reminders for users scheduled around this time
    const { data: dailyReminderUsers, error: dailyError } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('enabled', true)
      .eq('daily_reminder', true)
      .gte('daily_reminder_time', '11:00')
      .lte('daily_reminder_time', '13:00')

    if (!dailyError && dailyReminderUsers) {
      for (const user of dailyReminderUsers) {
        notifications.push(
          notificationService.sendToUser(user.user_id, {
            title: '75 Hard Daily Check-in',
            body: 'Time to complete your daily tasks! 💪',
            tag: 'daily',
            data: { type: 'daily' },
            actions: [
              { action: 'open-checklist', title: 'Open Checklist' },
              { action: 'dismiss', title: 'Dismiss' }
            ]
          })
        )
      }
    }

    // 2. Check streaks and send milestone notifications
    const { data: challenges, error: challengesError } = await supabase
      .from('challenges')
      .select('user_id, current_streak')
      .eq('is_active', true)

    if (!challengesError && challenges) {
      const milestones = [7, 14, 21, 30, 40, 50, 60, 70, 75]
      
      for (const challenge of challenges) {
        if (milestones.includes(challenge.current_streak)) {
          notifications.push(
            notificationService.sendStreakNotification(
              challenge.user_id,
              challenge.current_streak
            )
          )
        }
      }
    }

    // 3. Send a general daily notification to all users with notifications enabled
    // This ensures everyone gets at least one reminder per day
    const { data: allEnabledUsers, error: allUsersError } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('enabled', true)

    if (!allUsersError && allEnabledUsers) {
      // Only send if they haven't already received a daily reminder above
      const dailyUserIds = new Set(dailyReminderUsers?.map(u => u.user_id) || [])
      const generalReminderUsers = allEnabledUsers.filter(u => !dailyUserIds.has(u.user_id))
      
      for (const user of generalReminderUsers) {
        notifications.push(
          notificationService.sendToUser(user.user_id, {
            title: '75 Hard Daily Reminder',
            body: 'Stay on track with your 75 Hard journey! Check your progress.',
            tag: 'daily-general',
            data: { type: 'daily-general' },
            actions: [
              { action: 'open-dashboard', title: 'Open Dashboard' },
              { action: 'dismiss', title: 'Dismiss' }
            ]
          })
        )
      }
    }

    // Execute all notifications
    await Promise.allSettled(notifications)

    return NextResponse.json({ 
      success: true, 
      timestamp: now.toISOString(),
      notificationsSent: notifications.length,
      details: {
        dailyReminders: dailyReminderUsers?.length || 0,
        streakNotifications: challenges?.filter(c => [7, 14, 21, 30, 40, 50, 60, 70, 75].includes(c.current_streak)).length || 0,
        generalReminders: allEnabledUsers?.length || 0
      }
    })
  } catch (error) {
    console.error('Daily cron job error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}