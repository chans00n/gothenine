'use client'

import { useEffect } from 'react'

export function PWAInit() {
  useEffect(() => {
    if ('serviceWorker' in navigator && window.workbox !== undefined) {
      const wb = window.workbox
      
      wb.addEventListener('installed', (event: any) => {
        if (event.isUpdate) {
          if (confirm('New app update is available! Click OK to refresh.')) {
            window.location.reload()
          }
        }
      })
      
      wb.register()
    }
  }, [])

  return null
}