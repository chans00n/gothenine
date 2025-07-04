"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCircle2, Trophy, TrendingUp, Calendar, Info, Trash2, Settings } from "lucide-react"
import { inAppNotificationService, type InAppNotification } from '@/lib/services/in-app-notification-service'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import Link from 'next/link'

export function NotificationsContent() {
  const [notifications, setNotifications] = useState<InAppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let subscription: any = null

    const setupNotifications = async () => {
      await loadNotifications()
      
      // Subscribe to real-time updates
      subscription = await inAppNotificationService.subscribeToChanges(() => {
        loadNotifications()
      })
    }

    setupNotifications()

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const loadNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        inAppNotificationService.getNotifications(),
        inAppNotificationService.getUnreadCount()
      ])
      setNotifications(notifs)
      setUnreadCount(count)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await inAppNotificationService.markAsRead(notificationId)
      await loadNotifications()
    } catch (error) {
      toast.error('Failed to mark as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await inAppNotificationService.markAllAsRead()
      await loadNotifications()
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error('Failed to mark all as read')
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all notifications?')) return
    
    try {
      await inAppNotificationService.clearAll()
      await loadNotifications()
      toast.success('All notifications cleared')
    } catch (error) {
      toast.error('Failed to clear notifications')
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await inAppNotificationService.deleteNotification(notificationId)
      await loadNotifications()
    } catch (error) {
      toast.error('Failed to delete notification')
    }
  }

  const getIcon = (type: InAppNotification['type']) => {
    switch (type) {
      case 'achievement':
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 'reminder':
        return <Bell className="h-5 w-5 text-blue-500" />
      case 'progress':
        return <TrendingUp className="h-5 w-5 text-green-500" />
      case 'system':
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="container px-4 md:px-6 py-6 md:py-8 max-w-4xl">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-24" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 md:px-6 py-6 md:py-8 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your progress and reminders
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {unreadCount} new
              </Badge>
            )}
            <Link href="/settings/notifications">
              <Button variant="outline" size="icon" aria-label="Notification settings">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="mb-4 flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClearAll}
          >
            Clear all
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card 
            key={notification.id} 
            className={notification.read ? "opacity-60" : "border-primary/20 shadow-sm"}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">
                      {notification.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <Badge variant="default" className="text-xs">
                          New
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDelete(notification.id)}
                        aria-label="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="mt-1">
                    {notification.description}
                  </CardDescription>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </CardHeader>
            {!notification.read && (
              <CardContent className="pt-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Mark as read
                </Button>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {notifications.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No notifications yet. We'll notify you when something important happens!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}