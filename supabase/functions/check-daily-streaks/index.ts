// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const now = new Date()
    console.log(`Daily streak check running at ${now.toISOString()}`)

    // Import web-push
    const webpush = await import('https://esm.sh/web-push@3.6.7')
    
    // Set VAPID details
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:noreply@75hard-tracker.com'
    
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

    // Get all active challenges
    const { data: challenges, error } = await supabase
      .from('challenges')
      .select('user_id, current_streak')
      .eq('is_active', true)

    if (error) {
      throw new Error('Failed to fetch challenges: ' + error.message)
    }

    // Check for streak milestones
    const milestones = [7, 14, 21, 30, 40, 50, 60, 70, 75]
    let notificationsSent = 0
    let notificationsFailed = 0

    for (const challenge of challenges || []) {
      if (milestones.includes(challenge.current_streak)) {
        // Check if user wants streak notifications
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('enabled, streak_alerts')
          .eq('user_id', challenge.user_id)
          .single()

        if (!prefs?.enabled || !prefs?.streak_alerts) continue

        // Get user's push subscriptions
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', challenge.user_id)

        if (!subscriptions || subscriptions.length === 0) {
          notificationsFailed++
          continue
        }

        // Send streak notification to all user's devices
        const payload = {
          title: `🔥 ${challenge.current_streak} Day Streak!`,
          body: `Amazing! You've maintained a ${challenge.current_streak} day streak!`,
          icon: '/icon-512x512.png',
          badge: '/icon-192x192.png',
          tag: 'streak',
          data: { type: 'streak', days: challenge.current_streak }
        }

        for (const subscription of subscriptions) {
          try {
            await webpush.sendNotification(
              {
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: subscription.p256dh,
                  auth: subscription.auth
                }
              },
              JSON.stringify(payload)
            )
            notificationsSent++
          } catch (error: any) {
            notificationsFailed++
            console.error(`Failed to send streak notification:`, error.message)
            
            // Remove invalid subscriptions
            if (error.statusCode === 410) {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('id', subscription.id)
            }
          }
        }

        // Also create achievement notification if it's a major milestone
        const majorMilestones = [7, 30, 75]
        if (majorMilestones.includes(challenge.current_streak)) {
          const achievementTitles: Record<number, string> = {
            7: 'Week Warrior',
            30: 'Monthly Master',
            75: '75 Hard Champion!'
          }

          await supabase
            .from('notifications')
            .insert({
              user_id: challenge.user_id,
              title: achievementTitles[challenge.current_streak],
              description: `Congratulations on reaching ${challenge.current_streak} days!`,
              type: 'achievement',
              data: { streak: challenge.current_streak }
            })
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: now.toISOString(),
        challengesChecked: challenges?.length || 0,
        notificationsSent,
        notificationsFailed
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in check-daily-streaks function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})