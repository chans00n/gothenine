import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's notification preferences
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Failed to get preferences:', error)
      return NextResponse.json({ error: 'Failed to get preferences' }, { status: 500 })
    }

    // If no preferences exist, return defaults
    if (!data) {
      return NextResponse.json({
        enabled: false,
        daily_reminder: true,
        daily_reminder_time: '06:00',
        workout_reminders: true,
        workout_reminder_times: ['07:00', '17:00'],
        water_reminders: true,
        water_reminder_interval: 2,
        reading_reminder: true,
        reading_reminder_time: '20:00',
        photo_reminder: true,
        photo_reminder_time: '07:30',
        streak_alerts: true,
        achievement_alerts: true
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Get preferences error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get preferences from request body
    const preferences = await request.json()

    // Validate preferences
    const validatedPreferences = {
      enabled: Boolean(preferences.enabled),
      daily_reminder: Boolean(preferences.dailyReminder),
      daily_reminder_time: preferences.dailyReminderTime || '06:00',
      workout_reminders: Boolean(preferences.workoutReminders),
      workout_reminder_times: preferences.workoutReminderTimes || ['07:00', '17:00'],
      water_reminders: Boolean(preferences.waterReminders),
      water_reminder_interval: Number(preferences.waterReminderInterval) || 2,
      reading_reminder: Boolean(preferences.readingReminder),
      reading_reminder_time: preferences.readingReminderTime || '20:00',
      photo_reminder: Boolean(preferences.photoReminder),
      photo_reminder_time: preferences.photoReminderTime || '07:30',
      streak_alerts: Boolean(preferences.streakAlerts),
      achievement_alerts: Boolean(preferences.achievementAlerts)
    }

    // Upsert preferences
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        ...validatedPreferences
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to save preferences:', error)
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
    }

    // If notifications are enabled, schedule them
    if (validatedPreferences.enabled) {
      // TODO: Trigger notification scheduling
      // This would typically be done by a background job or cron service
    }

    return NextResponse.json({ 
      success: true,
      message: 'Notification preferences saved successfully',
      data
    })
  } catch (error) {
    console.error('Save preferences error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}