// Service Worker Timer functionality
// Handles background timer when the app is not in focus

// Check if we're in a service worker context
if (typeof self !== 'undefined' && self.addEventListener) {
  let timerState = {
    startTime: null,
    pausedTime: null,
    isRunning: false,
    isPaused: false,
    seconds: 0
  };

  // Listen for messages from the main app
  self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'START_TIMER':
      startTimer(data);
      break;
    case 'PAUSE_TIMER':
      pauseTimer();
      break;
    case 'RESUME_TIMER':
      resumeTimer();
      break;
    case 'STOP_TIMER':
      stopTimer();
      break;
    case 'GET_TIMER_STATE':
      sendTimerState();
      break;
    case 'SET_TIMER_STATE':
      timerState = { ...timerState, ...data };
      break;
  }
});

function startTimer(data = {}) {
  timerState = {
    startTime: Date.now(),
    pausedTime: null,
    isRunning: true,
    isPaused: false,
    seconds: data.seconds || 0
  };
  
  // Start interval
  startInterval();
  
  // Notify all clients
  broadcastTimerState();
}

function pauseTimer() {
  if (timerState.isRunning && !timerState.isPaused) {
    timerState.isPaused = true;
    timerState.pausedTime = Date.now();
    clearInterval(self.timerInterval);
    broadcastTimerState();
  }
}

function resumeTimer() {
  if (timerState.isRunning && timerState.isPaused) {
    timerState.isPaused = false;
    const pauseDuration = Date.now() - timerState.pausedTime;
    timerState.startTime += pauseDuration;
    timerState.pausedTime = null;
    startInterval();
    broadcastTimerState();
  }
}

function stopTimer() {
  timerState = {
    startTime: null,
    pausedTime: null,
    isRunning: false,
    isPaused: false,
    seconds: 0
  };
  
  clearInterval(self.timerInterval);
  broadcastTimerState();
}

function startInterval() {
  // Clear any existing interval
  clearInterval(self.timerInterval);
  
  // Update timer every second
  self.timerInterval = setInterval(() => {
    if (timerState.isRunning && !timerState.isPaused) {
      const elapsed = Math.floor((Date.now() - timerState.startTime) / 1000);
      timerState.seconds = elapsed + (timerState.initialSeconds || 0);
      
      // Send update to all clients
      broadcastTimerState();
      
      // Check for milestone notifications
      checkMilestones();
    }
  }, 1000);
}

function checkMilestones() {
  const { seconds } = timerState;
  
  // Send notifications at specific milestones
  if (seconds === 900) { // 15 minutes
    showNotification('15 minutes completed! Keep going! 💪');
  } else if (seconds === 1800) { // 30 minutes
    showNotification('30 minutes done! You\'re crushing it! 🔥');
  } else if (seconds === 2700) { // 45 minutes
    showNotification('45 minutes complete! Almost there! 🎯');
  } else if (seconds === 3600) { // 60 minutes
    showNotification('1 hour workout complete! Amazing job! 🎉');
  }
}

function showNotification(message) {
  self.registration.showNotification('75 Hard Timer', {
    body: message,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'timer-milestone',
    requireInteraction: false
  });
}

function sendTimerState() {
  broadcastTimerState();
}

function broadcastTimerState() {
  // Get all clients and send them the timer state
  self.clients.matchAll({
    includeUncontrolled: true,
    type: 'window'
  }).then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'TIMER_UPDATE',
        data: timerState
      });
    });
  });
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Focus on the app or open it
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      
      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('/timer');
      }
    })
  );
});

// Clean up on activation
self.addEventListener('activate', (event) => {
  // Clear any existing timer intervals
  clearInterval(self.timerInterval);
});

} // Close the service worker context check