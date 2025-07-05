// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, any>
  actions?: Array<{
    action: string
    title: string
  }>
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Create Supabase client with service role for database access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get current time
    const now = new Date()
    const currentTime = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`
    
    console.log(`Notification cron running at ${now.toISOString()} (${currentTime} UTC)`)

    const notificationsToSend: Array<{ userId: string; payload: NotificationPayload }> = []

    // 1. Daily reminders
    const { data: dailyUsers } = await supabase
      .from('notification_preferences')
      .select('user_id, daily_reminder_time')
      .eq('enabled', true)
      .eq('daily_reminder', true)

    if (dailyUsers) {
      for (const user of dailyUsers) {
        // Check if user's time matches current time (with 5-minute window)
        const userTime = user.daily_reminder_time
        if (isTimeMatch(currentTime, userTime, 5)) {
          notificationsToSend.push({
            userId: user.user_id,
            payload: {
              title: 'Go the Nine Check-in',
              body: 'Time to complete your daily tasks! 💪',
              tag: 'daily',
              data: { type: 'daily' },
              actions: [
                { action: 'open-checklist', title: 'Open Checklist' },
                { action: 'dismiss', title: 'Dismiss' }
              ]
            }
          })
        }
      }
    }

    // 2. Workout reminders
    const { data: workoutUsers } = await supabase
      .from('notification_preferences')
      .select('user_id, workout_reminder_times')
      .eq('enabled', true)
      .eq('workout_reminders', true)

    if (workoutUsers) {
      for (const user of workoutUsers) {
        const times = user.workout_reminder_times || []
        times.forEach((time: string, index: number) => {
          if (isTimeMatch(currentTime, time, 5)) {
            notificationsToSend.push({
              userId: user.user_id,
              payload: {
                title: `Workout ${index + 1} Reminder`,
                body: index === 0 ? 'Time for your indoor workout! 🏋️' : 'Time for your outdoor workout! 🏃',
                tag: 'workout',
                data: { type: 'workout', workoutNumber: index + 1 },
                actions: [
                  { action: 'start-timer', title: 'Start Timer' },
                  { action: 'mark-complete', title: 'Mark Complete' }
                ]
              }
            })
          }
        })
      }
    }

    // 3. Water reminders (check every user's timezone)
    const currentMinute = now.getUTCMinutes()
    
    // Only check at the top of the hour when cron runs
    if (currentMinute >= 0 && currentMinute < 5) {
      // Get all users with water reminders enabled along with their timezone
      const { data: waterUsers } = await supabase
        .from('notification_preferences')
        .select('user_id, water_reminder_interval')
        .eq('enabled', true)
        .eq('water_reminders', true)

      if (waterUsers) {
        // Get user profiles to check timezone
        const userIds = waterUsers.map(u => u.user_id)
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, timezone')
          .in('id', userIds)

        for (const user of waterUsers) {
          const profile = profiles?.find(p => p.id === user.user_id)
          const userTimezone = profile?.timezone || 'America/New_York'
          
          // Get current hour in user's timezone
          const userTime = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }))
          const userHour = userTime.getHours()
          
          console.log(`Water reminder check for user ${user.user_id}: timezone=${userTimezone}, userHour=${userHour}, interval=${user.water_reminder_interval || 2}`)
          
          // Send water reminders between 7 AM and 9 PM in user's timezone
          // Every interval hours (default 2)
          const interval = user.water_reminder_interval || 2
          
          // Check if it's within waking hours and at the right interval
          if (userHour >= 7 && userHour <= 21) {
            // For interval of 2, send at: 8, 10, 12, 14, 16, 18, 20
            // Start from 8 AM (first reminder after 7 AM start)
            const hoursSince8AM = userHour - 8
            if (hoursSince8AM >= 0 && hoursSince8AM % interval === 0) {
              console.log(`Sending water reminder to user ${user.user_id} at hour ${userHour}`)
              notificationsToSend.push({
              userId: user.user_id,
              payload: {
                title: 'Water Reminder 💧',
                body: 'Time to drink water! Stay hydrated!',
                tag: 'water',
                data: { type: 'water' },
                actions: [
                  { action: 'log-water', title: 'Log Water' },
                  { action: 'snooze', title: 'Remind Later' }
                ]
              }
            })
            }
          }
        }
      }
    }

    // 4. Reading reminders
    const { data: readingUsers } = await supabase
      .from('notification_preferences')
      .select('user_id, reading_reminder_time')
      .eq('enabled', true)
      .eq('reading_reminder', true)

    if (readingUsers) {
      for (const user of readingUsers) {
        if (isTimeMatch(currentTime, user.reading_reminder_time, 5)) {
          notificationsToSend.push({
            userId: user.user_id,
            payload: {
              title: 'Reading Time 📚',
              body: "Don't forget to read your 10 pages today!",
              tag: 'reading',
              data: { type: 'reading' },
              actions: [
                { action: 'log-reading', title: 'Log Reading' },
                { action: 'dismiss', title: 'Dismiss' }
              ]
            }
          })
        }
      }
    }

    // 5. Photo reminders
    const { data: photoUsers } = await supabase
      .from('notification_preferences')
      .select('user_id, photo_reminder_time')
      .eq('enabled', true)
      .eq('photo_reminder', true)

    if (photoUsers) {
      for (const user of photoUsers) {
        if (isTimeMatch(currentTime, user.photo_reminder_time, 5)) {
          notificationsToSend.push({
            userId: user.user_id,
            payload: {
              title: 'Progress Photo 📸',
              body: 'Time to take your daily progress photo!',
              tag: 'photo',
              data: { type: 'photo' },
              actions: [
                { action: 'take-photo', title: 'Take Photo' },
                { action: 'snooze', title: 'Remind Later' }
              ]
            }
          })
        }
      }
    }

    // Send notifications via your Next.js API
    let sent = 0
    let failed = 0

    for (const { userId, payload } of notificationsToSend) {
      try {
        const response = await fetch('https://www.gothenine.com/api/notifications/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('NOTIFICATION_API_KEY') || 'internal-key'}`
          },
          body: JSON.stringify({ userId, notification: payload })
        })

        if (response.ok) {
          sent++
        } else {
          failed++
          console.error(`Failed to send notification to user ${userId}:`, await response.text())
        }
      } catch (error) {
        failed++
        console.error(`Error sending notification to user ${userId}:`, error)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: now.toISOString(),
        notificationsQueued: notificationsToSend.length,
        notificationsSent: sent,
        notificationsFailed: failed
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in send-notifications function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Helper function to check if times match within a window
function isTimeMatch(currentTime: string, targetTime: string, windowMinutes: number): boolean {
  const [currentHour, currentMin] = currentTime.split(':').map(Number)
  const [targetHour, targetMin] = targetTime.split(':').map(Number)
  
  const currentMinutes = currentHour * 60 + currentMin
  const targetMinutes = targetHour * 60 + targetMin
  
  const diff = Math.abs(currentMinutes - targetMinutes)
  return diff <= windowMinutes
}