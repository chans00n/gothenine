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
  
  let title = 'Go the Nine Tracker';
  let body = 'Push notification received!';
  let options = {
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'test-notification',
    renotify: true
  };
  
  // Parse the push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Push data:', data);
      
      // Extract title and body from the data
      if (data.title) {
        title = data.title;
      }
      
      // Handle body - if it's an array, join it nicely
      if (data.body) {
        if (Array.isArray(data.body)) {
          body = data.body.join('\n');
        } else {
          body = data.body;
        }
      }
      
      // Handle actions array if present
      if (data.actions && Array.isArray(data.actions)) {
        body = data.actions.join('\n');
      }
      
      // Copy over any other notification options
      if (data.icon) options.icon = data.icon;
      if (data.badge) options.badge = data.badge;
      if (data.tag) options.tag = data.tag;
      if (data.data) options.data = data.data;
    } catch (e) {
      console.error('Error parsing push data:', e);
      // Fallback to text if JSON parsing fails
      body = event.data.text();
    }
  }
  
  options.body = body;
  
  event.waitUntil(
    self.registration.showNotification(title, options)
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