'use client'

import { useEffect } from 'react'

export function PWAInit() {
  useEffect(() => {
    // Basic PWA initialization
    // next-pwa handles service worker registration automatically
    
    if (typeof window === 'undefined') return

    // Log PWA status for debugging
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        console.log('PWA: Service Worker ready', registration)
      }).catch((error) => {
        console.log('PWA: Service Worker registration failed', error)
      })
    }

    // Handle install prompt
    let deferredPrompt: any = null
    
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later
      deferredPrompt = e
      console.log('PWA: Install prompt available')
    })

    window.addEventListener('appinstalled', () => {
      console.log('PWA: App was installed')
      deferredPrompt = null
    })
  }, [])

  return null
}