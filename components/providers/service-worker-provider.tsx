"use client"

import { useEffect } from 'react'
import { getNotificationService } from '@/lib/services/notification-service'

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        console.log('Service Worker registered:', registration)
        
        // Initialize notification service
        const notificationService = getNotificationService()
        notificationService.initialize(registration)
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          const { type, data } = event.data || {}
          
          switch (type) {
            case 'SYNC_COMPLETE':
              console.log('Background sync completed:', data)
              break
            case 'TASK_COMPLETE':
              console.log('Task marked complete:', data.taskType)
              // TODO: Update UI based on completed task
              break
          }
        })
      })
    }
  }, [])

  return <>{children}</>
}