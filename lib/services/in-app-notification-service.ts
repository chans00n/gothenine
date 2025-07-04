import { createClient } from '@/lib/supabase/client'

export interface InAppNotification {
  id: string
  user_id: string
  title: string
  description: string
  type: 'achievement' | 'reminder' | 'progress' | 'system'
  read: boolean
  created_at: string
  data?: Record<string, any>
}

class InAppNotificationService {
  private static instance: InAppNotificationService
  private supabase = createClient()

  private constructor() {}

  static getInstance(): InAppNotificationService {
    if (!InAppNotificationService.instance) {
      InAppNotificationService.instance = new InAppNotificationService()
    }
    return InAppNotificationService.instance
  }

  // Get all notifications for the current user
  async getNotifications(limit = 50): Promise<InAppNotification[]> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching notifications:', error)
      // If table doesn't exist, return empty array instead of throwing
      if (error.code === '42P01') {
        console.warn('Notifications table does not exist yet')
        return []
      }
      return []
    }

    return data || []
  }

  // Get unread count
  async getUnreadCount(): Promise<number> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return 0

    const { count, error } = await this.supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)

    if (error) {
      console.error('Error fetching unread count:', error)
      // If table doesn't exist, return 0 instead of throwing
      if (error.code === '42P01') {
        console.warn('Notifications table does not exist yet')
        return 0
      }
      return 0
    }

    return count || 0
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }

  // Mark all as read
  async markAllAsRead(): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return

    const { error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)

    if (error) {
      console.error('Error marking all as read:', error)
      throw error
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      console.error('Error deleting notification:', error)
      throw error
    }
  }

  // Clear all notifications
  async clearAll(): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return

    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Error clearing notifications:', error)
      throw error
    }
  }

  // Create a notification
  async createNotification(notification: {
    title: string
    description: string
    type: InAppNotification['type']
    data?: Record<string, any>
  }): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return

    const { error } = await this.supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        ...notification,
        read: false
      })

    if (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  // Subscribe to notification changes
  async subscribeToChanges(callback: (payload: any) => void) {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return null

    return this.supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        callback
      )
      .subscribe()
  }
}

export const inAppNotificationService = InAppNotificationService.getInstance()