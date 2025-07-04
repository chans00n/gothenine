"use client"

import { useEffect } from 'react'
import { getPerformanceMonitor, analyzeBundleSize } from '@/lib/utils/performance'

export function PerformanceMonitor() {
  useEffect(() => {
    // Initialize performance monitoring
    const perfMonitor = getPerformanceMonitor()
    perfMonitor.getCoreWebVitals()
    perfMonitor.monitorResources()
    
    // Analyze bundle size in development
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        analyzeBundleSize()
      }, 3000)
    }

    // Monitor route changes
    const handleRouteStart = () => {
      getPerformanceMonitor().mark('route-change')
    }

    const handleRouteComplete = () => {
      const duration = getPerformanceMonitor().measure('route-change')
      if (duration && duration > 1000) {
        console.warn(`Slow route change: ${duration}ms`)
      }
    }

    // Listen for navigation events
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleRouteStart)
      window.addEventListener('load', handleRouteComplete)
      
      // Performance logging on visibility change (useful for PWA)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          getPerformanceMonitor().mark('app-visible')
        } else {
          const duration = getPerformanceMonitor().measure('app-visible')
          if (duration) {
            console.log(`App was visible for: ${duration}ms`)
          }
        }
      })
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleRouteStart)
        window.removeEventListener('load', handleRouteComplete)
      }
    }
  }, [])

  // This component doesn't render anything
  return null
}

// Performance debugging panel (development only)
export function PerformanceDebugPanel() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Add performance debug info to window for console access
      ;(window as any).__75hardPerf__ = {
        getMetrics: () => getPerformanceMonitor().getMetrics(),
        clearMetrics: () => getPerformanceMonitor().clear(),
        mark: (name: string) => getPerformanceMonitor().mark(name),
        measure: (name: string) => getPerformanceMonitor().measure(name),
      }

      console.log('🔍 Performance debugging available at window.__75hardPerf__')
    }
  }, [])

  return null
}