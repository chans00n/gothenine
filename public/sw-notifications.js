// Notification handling for Service Worker
// Manages scheduled notifications and push notifications

// Store for scheduled notifications
let scheduledNotifications = []

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  const { type, data } = event.data || {}

  switch (type) {
    case 'SCHEDULE_NOTIFICATIONS':
      await scheduleNotifications(event.data.notifications)
      break
    case 'CANCEL_ALL_NOTIFICATIONS':
      await cancelAllNotifications()
      break
    case 'CANCEL_NOTIFICATION':
      await cancelNotification(event.data.notificationId)
      break
  }
})

// Schedule notifications
async function scheduleNotifications(notifications) {
  scheduledNotifications = notifications
  
  // Store in cache for persistence
  const cache = await caches.open('75hard-notifications')
  await cache.put('/scheduled-notifications', new Response(
    JSON.stringify(notifications),
    { headers: { 'Content-Type': 'application/json' } }
  ))
  
  // Set up next check
  scheduleNextCheck()
}

// Cancel all notifications
async function cancelAllNotifications() {
  scheduledNotifications = []
  
  const cache = await caches.open('75hard-notifications')
  await cache.delete('/scheduled-notifications')
}

// Cancel specific notification
async function cancelNotification(notificationId) {
  scheduledNotifications = scheduledNotifications.filter(n => n.id !== notificationId)
  
  const cache = await caches.open('75hard-notifications')
  await cache.put('/scheduled-notifications', new Response(
    JSON.stringify(scheduledNotifications),
    { headers: { 'Content-Type': 'application/json' } }
  ))
}

// Check and show due notifications
async function checkNotifications() {
  const now = new Date()
  const dueNotifications = []
  const remainingNotifications = []
  
  for (const notification of scheduledNotifications) {
    const scheduledTime = new Date(notification.scheduledFor)
    
    if (scheduledTime <= now) {
      dueNotifications.push(notification)
      
      // If it's a recurring notification, reschedule it
      if (['daily', 'workout', 'water', 'reading', 'photo'].includes(notification.type)) {
        const nextScheduled = new Date(scheduledTime)
        
        switch (notification.type) {
          case 'water':
            // Water reminders repeat throughout the day
            nextScheduled.setHours(nextScheduled.getHours() + 2)
            if (nextScheduled.getHours() >= 7 && nextScheduled.getHours() <= 21) {
              remainingNotifications.push({
                ...notification,
                scheduledFor: nextScheduled
              })
            }
            break
          default:
            // Other notifications repeat next day
            nextScheduled.setDate(nextScheduled.getDate() + 1)
            remainingNotifications.push({
              ...notification,
              scheduledFor: nextScheduled
            })
        }
      }
    } else {
      remainingNotifications.push(notification)
    }
  }
  
  // Show due notifications
  for (const notification of dueNotifications) {
    await showNotification(notification)
  }
  
  // Update scheduled notifications
  if (dueNotifications.length > 0) {
    await scheduleNotifications(remainingNotifications)
  }
  
  // Schedule next check
  scheduleNextCheck()
}

// Show a notification
async function showNotification(notification) {
  const { title, body, type, data } = notification
  
  const options = {
    body,
    icon: '/icon-512x512.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: type,
    renotify: true,
    data: { ...data, type },
    actions: getNotificationActions(type)
  }
  
  await self.registration.showNotification(title, options)
}

// Get notification actions based on type
function getNotificationActions(type) {
  switch (type) {
    case 'daily':
      return [
        { action: 'open-checklist', title: 'Open Checklist' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    case 'workout':
      return [
        { action: 'start-timer', title: 'Start Timer' },
        { action: 'mark-complete', title: 'Mark Complete' }
      ]
    case 'water':
      return [
        { action: 'log-water', title: 'Log Water' },
        { action: 'snooze', title: 'Remind Later' }
      ]
    case 'reading':
      return [
        { action: 'log-reading', title: 'Log Reading' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    case 'photo':
      return [
        { action: 'take-photo', title: 'Take Photo' },
        { action: 'snooze', title: 'Remind Later' }
      ]
    default:
      return []
  }
}

// Schedule next notification check
function scheduleNextCheck() {
  // Check every minute for due notifications
  setTimeout(() => checkNotifications(), 60000)
}

// Handle notification clicks
self.addEventListener('notificationclick', async (event) => {
  event.notification.close()
  
  const { action } = event
  const { type } = event.notification.data || {}
  
  let url = '/'
  
  // Handle different actions
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
  } else if (action === 'mark-complete') {
    // Handle marking task as complete
    await markTaskComplete(type)
    return
  } else if (action === 'snooze') {
    // Snooze for 30 minutes
    await snoozeNotification(event.notification.data, 30)
    return
  }
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
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

// Mark task as complete
async function markTaskComplete(taskType) {
  // Send message to all clients
  const clients = await self.clients.matchAll()
  clients.forEach(client => {
    client.postMessage({
      type: 'TASK_COMPLETE',
      taskType
    })
  })
}

// Snooze notification
async function snoozeNotification(notificationData, minutes) {
  const snoozedNotification = {
    ...notificationData,
    id: `${notificationData.type}-snoozed-${Date.now()}`,
    scheduledFor: new Date(Date.now() + minutes * 60000)
  }
  
  scheduledNotifications.push(snoozedNotification)
  await scheduleNotifications(scheduledNotifications)
}

// Handle push notifications
self.addEventListener('push', async (event) => {
  if (!event.data) return
  
  const data = event.data.json()
  const { title, body, ...options } = data
  
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-512x512.png',
      badge: '/icon-192x192.png',
      ...options
    })
  )
})

// Load scheduled notifications on service worker activation
self.addEventListener('activate', async (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open('75hard-notifications')
        const response = await cache.match('/scheduled-notifications')
        
        if (response) {
          scheduledNotifications = await response.json()
          scheduleNextCheck()
        }
      } catch (error) {
        console.error('Failed to load scheduled notifications:', error)
      }
    })()
  )
})