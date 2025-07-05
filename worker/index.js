// Custom service worker that adds push notification support
// This file is used by next-pwa to generate the final service worker

// Import push notification handlers
importScripts('/sw-notifications.js')

// Handle push events for notifications from server
self.addEventListener('push', async (event) => {
  if (!event.data) return
  
  try {
    const data = event.data.json()
    const { title, body, icon, badge, tag, actions, ...options } = data
    
    const notificationOptions = {
      body,
      icon: icon || '/icon-512x512.png',
      badge: badge || '/icon-192x192.png',
      tag: tag || 'default',
      vibrate: [200, 100, 200],
      renotify: true,
      requireInteraction: false,
      actions: actions || [],
      ...options
    }
    
    event.waitUntil(
      self.registration.showNotification(title, notificationOptions)
    )
  } catch (error) {
    console.error('Error showing push notification:', error)
  }
})

// Handle notification click events
self.addEventListener('notificationclick', async (event) => {
  event.notification.close()
  
  const { action } = event
  const { type, data } = event.notification.data || {}
  
  let url = '/'
  
  // Route based on notification type and action
  if (action === 'open-checklist' || (!action && type === 'daily')) {
    url = '/checklist'
  } else if (action === 'start-timer' || (!action && type === 'workout')) {
    url = '/timer'
  } else if (action === 'log-water' || (!action && type === 'water')) {
    url = '/water'
  } else if (action === 'log-reading' || (!action && type === 'reading')) {
    url = '/checklist#reading'
  } else if (action === 'take-photo' || (!action && type === 'photo')) {
    url = '/photos'
  } else if (!action && type === 'streak') {
    url = '/progress'
  }
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Check if app is already open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      // Open new window if not open
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})