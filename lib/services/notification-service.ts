// Notification Service for 75 Hard Tracker
// Handles push notifications, local notifications, and notification preferences

export interface NotificationPreferences {
  enabled: boolean
  dailyReminder: boolean
  dailyReminderTime: string // Format: "HH:MM"
  workoutReminders: boolean
  workoutReminderTimes: string[] // Format: ["HH:MM", "HH:MM"]
  waterReminders: boolean
  waterReminderInterval: number // In hours
  readingReminder: boolean
  readingReminderTime: string // Format: "HH:MM"
  photoReminder: boolean
  photoReminderTime: string // Format: "HH:MM"
  streakAlerts: boolean
  achievementAlerts: boolean
}

export interface ScheduledNotification {
  id: string
  title: string
  body: string
  scheduledFor: Date
  type: 'daily' | 'workout' | 'water' | 'reading' | 'photo' | 'streak' | 'achievement'
  data?: Record<string, any>
}

class NotificationService {
  private static instance: NotificationService
  private registration: ServiceWorkerRegistration | null = null
  private isSupported: boolean = false

  private constructor() {
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
      this.isSupported = 'Notification' in window && 'serviceWorker' in navigator
    } else {
      this.isSupported = false
    }
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  async initialize(registration: ServiceWorkerRegistration) {
    this.registration = registration
    
    if (!this.isSupported) {
      console.warn('Notifications are not supported in this browser')
      return false
    }

    return true
  }

  // Check if notifications are supported
  isNotificationSupported(): boolean {
    return this.isSupported
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported) return 'denied'
    return Notification.permission
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Notifications are not supported')
    }

    const permission = await Notification.requestPermission()
    
    // If permission granted, subscribe to push notifications
    if (permission === 'granted' && this.registration) {
      await this.subscribeToPush()
    }

    return permission
  }

  // Subscribe to push notifications
  private async subscribeToPush() {
    if (!this.registration) {
      throw new Error('Service worker not registered')
    }

    try {
      // Check if already subscribed
      let subscription = await this.registration.pushManager.getSubscription()
      
      if (!subscription) {
        // Subscribe with VAPID public key (you'll need to generate this)
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
        })
      }

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription)
      
      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      throw error
    }
  }

  // Helper to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
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

  // Send subscription to server
  private async sendSubscriptionToServer(subscription: PushSubscription) {
    // TODO: Implement sending subscription to your backend
    console.log('Subscription:', subscription)
  }

  // Show a notification immediately
  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.isSupported || this.getPermissionStatus() !== 'granted') {
      throw new Error('Notifications not permitted')
    }

    if (this.registration) {
      // Use service worker to show notification
      await this.registration.showNotification(title, {
        badge: '/icon-192x192.png',
        icon: '/icon-512x512.png',
        vibrate: [200, 100, 200],
        ...options
      })
    } else {
      // Fallback to Notification API
      new Notification(title, options)
    }
  }

  // Schedule notifications based on preferences
  async scheduleNotifications(preferences: NotificationPreferences, timezone: string): Promise<void> {
    if (!preferences.enabled || this.getPermissionStatus() !== 'granted') {
      return
    }

    const notifications: ScheduledNotification[] = []

    // Daily reminder
    if (preferences.dailyReminder) {
      notifications.push({
        id: 'daily-reminder',
        title: '75 Hard Daily Check-in',
        body: 'Time to complete your daily tasks! 💪',
        scheduledFor: this.getNextScheduledTime(preferences.dailyReminderTime, timezone),
        type: 'daily'
      })
    }

    // Workout reminders
    if (preferences.workoutReminders) {
      preferences.workoutReminderTimes.forEach((time, index) => {
        notifications.push({
          id: `workout-reminder-${index}`,
          title: `Workout ${index + 1} Reminder`,
          body: index === 0 ? 'Time for your indoor workout! 🏋️' : 'Time for your outdoor workout! 🏃',
          scheduledFor: this.getNextScheduledTime(time, timezone),
          type: 'workout'
        })
      })
    }

    // Water reminders
    if (preferences.waterReminders) {
      const now = new Date()
      const interval = preferences.waterReminderInterval * 60 * 60 * 1000 // Convert hours to ms
      
      for (let i = 1; i <= 8; i++) {
        const scheduledTime = new Date(now.getTime() + (interval * i))
        if (scheduledTime.getHours() >= 7 && scheduledTime.getHours() <= 21) {
          notifications.push({
            id: `water-reminder-${i}`,
            title: 'Water Reminder 💧',
            body: `Time to drink water! ${i}/8 glasses today`,
            scheduledFor: scheduledTime,
            type: 'water'
          })
        }
      }
    }

    // Reading reminder
    if (preferences.readingReminder) {
      notifications.push({
        id: 'reading-reminder',
        title: 'Reading Time 📚',
        body: 'Don\'t forget to read your 10 pages today!',
        scheduledFor: this.getNextScheduledTime(preferences.readingReminderTime, timezone),
        type: 'reading'
      })
    }

    // Photo reminder
    if (preferences.photoReminder) {
      notifications.push({
        id: 'photo-reminder',
        title: 'Progress Photo 📸',
        body: 'Time to take your daily progress photo!',
        scheduledFor: this.getNextScheduledTime(preferences.photoReminderTime, timezone),
        type: 'photo'
      })
    }

    // Store scheduled notifications
    await this.storeScheduledNotifications(notifications)
    
    // Send to service worker for scheduling
    if (this.registration?.active) {
      this.registration.active.postMessage({
        type: 'SCHEDULE_NOTIFICATIONS',
        notifications
      })
    }
  }

  // Get next scheduled time for a given time string
  private getNextScheduledTime(timeString: string, timezone: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number)
    const now = new Date()
    const scheduled = new Date()
    
    scheduled.setHours(hours, minutes, 0, 0)
    
    // If time has passed today, schedule for tomorrow
    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1)
    }
    
    return scheduled
  }

  // Store scheduled notifications
  private async storeScheduledNotifications(notifications: ScheduledNotification[]): Promise<void> {
    try {
      localStorage.setItem('75hard-scheduled-notifications', JSON.stringify(notifications))
    } catch (error) {
      console.error('Failed to store scheduled notifications:', error)
    }
  }

  // Get scheduled notifications
  async getScheduledNotifications(): Promise<ScheduledNotification[]> {
    try {
      const stored = localStorage.getItem('75hard-scheduled-notifications')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error)
    }
    return []
  }

  // Cancel all scheduled notifications
  async cancelAllNotifications(): Promise<void> {
    localStorage.removeItem('75hard-scheduled-notifications')
    
    if (this.registration?.active) {
      this.registration.active.postMessage({
        type: 'CANCEL_ALL_NOTIFICATIONS'
      })
    }
  }

  // Cancel specific notification
  async cancelNotification(notificationId: string): Promise<void> {
    const notifications = await this.getScheduledNotifications()
    const filtered = notifications.filter(n => n.id !== notificationId)
    await this.storeScheduledNotifications(filtered)
    
    if (this.registration?.active) {
      this.registration.active.postMessage({
        type: 'CANCEL_NOTIFICATION',
        notificationId
      })
    }
  }

  // Show achievement notification
  async showAchievementNotification(achievement: {
    title: string
    description: string
    badge?: string
  }): Promise<void> {
    await this.showNotification(`🏆 ${achievement.title}`, {
      body: achievement.description,
      tag: 'achievement',
      renotify: true,
      data: { type: 'achievement', badge: achievement.badge }
    })
  }

  // Show streak notification
  async showStreakNotification(streakDays: number): Promise<void> {
    await this.showNotification(`🔥 ${streakDays} Day Streak!`, {
      body: `Amazing! You've maintained a ${streakDays} day streak!`,
      tag: 'streak',
      renotify: true,
      data: { type: 'streak', days: streakDays }
    })
  }

  // Get default preferences
  getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: false,
      dailyReminder: true,
      dailyReminderTime: '06:00',
      workoutReminders: true,
      workoutReminderTimes: ['07:00', '17:00'],
      waterReminders: true,
      waterReminderInterval: 2, // Every 2 hours
      readingReminder: true,
      readingReminderTime: '20:00',
      photoReminder: true,
      photoReminderTime: '07:30',
      streakAlerts: true,
      achievementAlerts: true
    }
  }
}

// Export a getter function instead of an instance to avoid SSR issues
export const getNotificationService = () => {
  if (typeof window === 'undefined') {
    throw new Error('NotificationService can only be used in the browser')
  }
  return NotificationService.getInstance()
}