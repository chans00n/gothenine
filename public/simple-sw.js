// Simple service worker for testing
console.log('Simple service worker loading...');

// Install event - keep it minimal
self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  // Force activation
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
  // Take control of all clients
  event.waitUntil(clients.claim());
});

// Fetch event - just pass through
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

// Push event for notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Push notification received!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'test-notification',
    renotify: true
  };
  
  event.waitUntil(
    self.registration.showNotification('75 Hard Tracker', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

console.log('Simple service worker loaded');