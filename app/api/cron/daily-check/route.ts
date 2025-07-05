import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getPushNotificationService } from '@/lib/services/push-notification-service'

// This runs once daily to check streaks and send notifications
export async function GET() {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = headers().get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const notificationService = getPushNotificationService()
    
    // Get all active challenges
    const { data: challenges, error } = await supabase
      .from('challenges')
      .select('user_id, current_streak')
      .eq('is_active', true)

    if (error) {
      throw new Error('Failed to fetch challenges')
    }

    // Send streak notifications for milestones
    const milestones = [7, 14, 21, 30, 40, 50, 60, 70, 75]
    const streakNotifications: Promise<void>[] = []

    for (const challenge of challenges || []) {
      if (milestones.includes(challenge.current_streak)) {
        streakNotifications.push(
          notificationService.sendStreakNotification(
            challenge.user_id,
            challenge.current_streak
          )
        )
      }
    }

    await Promise.allSettled(streakNotifications)

    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      challengesChecked: challenges?.length || 0,
      streakNotificationsSent: streakNotifications.length
    })
  } catch (error) {
    console.error('Daily check cron job error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}