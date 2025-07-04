"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { inAppNotificationService } from '@/lib/services/in-app-notification-service'

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let subscription: any = null

    const setupNotifications = async () => {
      // Load initial count
      await loadUnreadCount()

      // Subscribe to changes
      subscription = await inAppNotificationService.subscribeToChanges(() => {
        loadUnreadCount()
      })
    }

    setupNotifications()

    // Poll for updates every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000)

    return () => {
      subscription?.unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const loadUnreadCount = async () => {
    try {
      const count = await inAppNotificationService.getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  return (
    <Link href="/notifications">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center"
          >
            <span className="text-xs text-white font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </motion.span>
        )}
      </Button>
    </Link>
  )
}