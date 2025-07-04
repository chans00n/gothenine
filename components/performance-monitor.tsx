"use client"

import { useEffect } from 'react'
import { performanceMonitor, analyzeBundleSize } from '@/lib/utils/performance'

export function PerformanceMonitor() {
  useEffect(() => {
    // Initialize performance monitoring
    performanceMonitor.getCoreWebVitals()
    performanceMonitor.monitorResources()
    
    // Analyze bundle size in development
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        analyzeBundleSize()
      }, 3000)
    }

    // Monitor route changes
    const handleRouteStart = () => {
      performanceMonitor.mark('route-change')
    }

    const handleRouteComplete = () => {
      const duration = performanceMonitor.measure('route-change')
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
          performanceMonitor.mark('app-visible')
        } else {
          const duration = performanceMonitor.measure('app-visible')
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
        getMetrics: () => performanceMonitor.getMetrics(),
        clearMetrics: () => performanceMonitor.clear(),
        mark: (name: string) => performanceMonitor.mark(name),
        measure: (name: string) => performanceMonitor.measure(name),
      }

      console.log('🔍 Performance debugging available at window.__75hardPerf__')
    }
  }, [])

  return null
}