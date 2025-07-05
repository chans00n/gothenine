'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register our simple service worker
      navigator.serviceWorker.register('/simple-sw.js')
        .then(registration => {
          console.log('Service worker registered:', registration.scope)
          
          // Check for updates periodically
          setInterval(() => {
            registration.update()
          }, 60 * 60 * 1000) // Check every hour
        })
        .catch(error => {
          console.error('Service worker registration failed:', error)
        })
    }
  }, [])

  return null
}