import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

// Initialize web-push with VAPID keys
// You need to generate these keys and add them to your environment variables
// Run: npx web-push generate-vapid-keys
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
  subject: process.env.VAPID_SUBJECT || 'mailto:noreply@75hard-tracker.com'
}

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    vapidKeys.subject,
    vapidKeys.publicKey,
    vapidKeys.privateKey
  )
}

export interface PushNotificationPayload {
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

export class PushNotificationService {
  private static instance: PushNotificationService

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService()
    }
    return PushNotificationService.instance
  }

  /**
   * Send a push notification to a specific user
   */
  async sendToUser(userId: string, payload: PushNotificationPayload): Promise<void> {
    const supabase = await createClient()
    
    // Get user's push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (error || !subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`)
      return
    }

    // Send to all user's subscriptions
    const sendPromises = subscriptions.map(subscription => 
      this.sendNotification(subscription, payload)
    )

    await Promise.allSettled(sendPromises)
  }

  /**
   * Send notifications to multiple users
   */
  async sendToUsers(userIds: string[], payload: PushNotificationPayload): Promise<void> {
    const sendPromises = userIds.map(userId => this.sendToUser(userId, payload))
    await Promise.allSettled(sendPromises)
  }

  /**
   * Send a notification to a specific subscription
   */
  private async sendNotification(
    subscription: {
      id: string
      endpoint: string
      p256dh: string
      auth: string
    },
    payload: PushNotificationPayload
  ): Promise<void> {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    }

    try {
      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/icon-512x512.png',
          badge: payload.badge || '/icon-192x192.png',
          tag: payload.tag,
          data: payload.data,
          actions: payload.actions
        })
      )
    } catch (error: any) {
      console.error(`Failed to send push notification to subscription ${subscription.id}:`, error)
      
      // If subscription is invalid, remove it
      if (error.statusCode === 410) {
        const supabase = await createClient()
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('id', subscription.id)
      }
    }
  }

  /**
   * Send daily reminder notifications
   */
  async sendDailyReminders(): Promise<void> {
    const supabase = await createClient()
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    // Get users who should receive daily reminders at this time
    const { data: users, error } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('enabled', true)
      .eq('daily_reminder', true)
      .eq('daily_reminder_time', currentTime)

    if (error || !users) {
      console.error('Failed to get users for daily reminders:', error)
      return
    }

    const payload: PushNotificationPayload = {
      title: '75 Hard Daily Check-in',
      body: 'Time to complete your daily tasks! 💪',
      tag: 'daily',
      data: { type: 'daily' },
      actions: [
        { action: 'open-checklist', title: 'Open Checklist' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    }

    await this.sendToUsers(users.map(u => u.user_id), payload)
  }

  /**
   * Send workout reminder notifications
   */
  async sendWorkoutReminders(workoutNumber: 1 | 2): Promise<void> {
    const supabase = await createClient()
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    // Get users who should receive workout reminders at this time
    const { data: users, error } = await supabase
      .from('notification_preferences')
      .select('user_id, workout_reminder_times')
      .eq('enabled', true)
      .eq('workout_reminders', true)

    if (error || !users) {
      console.error('Failed to get users for workout reminders:', error)
      return
    }

    // Filter users whose workout time matches current time
    const targetUsers = users.filter(user => {
      const times = user.workout_reminder_times || []
      return times[workoutNumber - 1] === currentTime
    })

    if (targetUsers.length === 0) return

    const payload: PushNotificationPayload = {
      title: `Workout ${workoutNumber} Reminder`,
      body: workoutNumber === 1 
        ? 'Time for your indoor workout! 🏋️' 
        : 'Time for your outdoor workout! 🏃',
      tag: 'workout',
      data: { type: 'workout', workoutNumber },
      actions: [
        { action: 'start-timer', title: 'Start Timer' },
        { action: 'mark-complete', title: 'Mark Complete' }
      ]
    }

    await this.sendToUsers(targetUsers.map(u => u.user_id), payload)
  }

  /**
   * Send water reminder notifications
   */
  async sendWaterReminders(): Promise<void> {
    const supabase = await createClient()
    const now = new Date()
    const currentHour = now.getHours()

    // Only send water reminders between 7am and 9pm
    if (currentHour < 7 || currentHour > 21) return

    // Get users who should receive water reminders
    const { data: users, error } = await supabase
      .from('notification_preferences')
      .select('user_id, water_reminder_interval, last_notification_sent_at')
      .eq('enabled', true)
      .eq('water_reminders', true)

    if (error || !users) {
      console.error('Failed to get users for water reminders:', error)
      return
    }

    // Filter users based on their interval
    const targetUsers = users.filter(user => {
      if (!user.last_notification_sent_at) return true
      
      const lastSent = new Date(user.last_notification_sent_at)
      const hoursSinceLastNotification = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60)
      
      return hoursSinceLastNotification >= (user.water_reminder_interval || 2)
    })

    if (targetUsers.length === 0) return

    const payload: PushNotificationPayload = {
      title: 'Water Reminder 💧',
      body: 'Time to drink water! Stay hydrated!',
      tag: 'water',
      data: { type: 'water' },
      actions: [
        { action: 'log-water', title: 'Log Water' },
        { action: 'snooze', title: 'Remind Later' }
      ]
    }

    await this.sendToUsers(targetUsers.map(u => u.user_id), payload)

    // Update last notification sent time
    const userIds = targetUsers.map(u => u.user_id)
    await supabase
      .from('notification_preferences')
      .update({ last_notification_sent_at: now.toISOString() })
      .in('user_id', userIds)
  }

  /**
   * Send reading reminder notifications
   */
  async sendReadingReminders(): Promise<void> {
    const supabase = await createClient()
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    // Get users who should receive reading reminders at this time
    const { data: users, error } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('enabled', true)
      .eq('reading_reminder', true)
      .eq('reading_reminder_time', currentTime)

    if (error || !users) {
      console.error('Failed to get users for reading reminders:', error)
      return
    }

    const payload: PushNotificationPayload = {
      title: 'Reading Time 📚',
      body: "Don't forget to read your 10 pages today!",
      tag: 'reading',
      data: { type: 'reading' },
      actions: [
        { action: 'log-reading', title: 'Log Reading' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    }

    await this.sendToUsers(users.map(u => u.user_id), payload)
  }

  /**
   * Send photo reminder notifications
   */
  async sendPhotoReminders(): Promise<void> {
    const supabase = await createClient()
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    // Get users who should receive photo reminders at this time
    const { data: users, error } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('enabled', true)
      .eq('photo_reminder', true)
      .eq('photo_reminder_time', currentTime)

    if (error || !users) {
      console.error('Failed to get users for photo reminders:', error)
      return
    }

    const payload: PushNotificationPayload = {
      title: 'Progress Photo 📸',
      body: 'Time to take your daily progress photo!',
      tag: 'photo',
      data: { type: 'photo' },
      actions: [
        { action: 'take-photo', title: 'Take Photo' },
        { action: 'snooze', title: 'Remind Later' }
      ]
    }

    await this.sendToUsers(users.map(u => u.user_id), payload)
  }

  /**
   * Send achievement notification
   */
  async sendAchievementNotification(
    userId: string, 
    achievement: { title: string; description: string; badge?: string }
  ): Promise<void> {
    const supabase = await createClient()
    
    // Check if user wants achievement alerts
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('enabled, achievement_alerts')
      .eq('user_id', userId)
      .single()

    if (!prefs?.enabled || !prefs?.achievement_alerts) return

    const payload: PushNotificationPayload = {
      title: `🏆 ${achievement.title}`,
      body: achievement.description,
      tag: 'achievement',
      data: { type: 'achievement', badge: achievement.badge }
    }

    await this.sendToUser(userId, payload)
  }

  /**
   * Send streak notification
   */
  async sendStreakNotification(userId: string, streakDays: number): Promise<void> {
    const supabase = await createClient()
    
    // Check if user wants streak alerts
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('enabled, streak_alerts')
      .eq('user_id', userId)
      .single()

    if (!prefs?.enabled || !prefs?.streak_alerts) return

    const payload: PushNotificationPayload = {
      title: `🔥 ${streakDays} Day Streak!`,
      body: `Amazing! You've maintained a ${streakDays} day streak!`,
      tag: 'streak',
      data: { type: 'streak', days: streakDays }
    }

    await this.sendToUser(userId, payload)
  }
}

// Export a getter function for the service
export const getPushNotificationService = () => PushNotificationService.getInstance()