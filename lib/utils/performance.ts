// Performance monitoring utilities

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Mark the start of a performance measurement
  mark(name: string): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${name}-start`)
      this.metrics.set(`${name}-start`, Date.now())
    }
  }

  // Mark the end and calculate duration
  measure(name: string): number | null {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${name}-end`)
      const startTime = this.metrics.get(`${name}-start`)
      
      if (startTime) {
        const duration = Date.now() - startTime
        this.metrics.set(name, duration)
        
        // Use Performance API if available
        try {
          performance.measure(name, `${name}-start`, `${name}-end`)
        } catch (error) {
          console.warn('Performance measurement failed:', error)
        }
        
        return duration
      }
    }
    return null
  }

  // Get Core Web Vitals
  getCoreWebVitals(): void {
    if (typeof window === 'undefined') return

    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lcpEntry = entries[entries.length - 1]
        console.log('LCP:', lcpEntry.startTime)
      })
      
      try {
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
      } catch (error) {
        console.warn('LCP observation failed:', error)
      }

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          console.log('FID:', entry.processingStart - entry.startTime)
        })
      })

      try {
        fidObserver.observe({ type: 'first-input', buffered: true })
      } catch (error) {
        console.warn('FID observation failed:', error)
      }

      // Cumulative Layout Shift (CLS)
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        console.log('CLS:', clsValue)
      })

      try {
        clsObserver.observe({ type: 'layout-shift', buffered: true })
      } catch (error) {
        console.warn('CLS observation failed:', error)
      }
    }
  }

  // Monitor resource loading
  monitorResources(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (navigation) {
        console.log('Navigation Metrics:', {
          'DNS Lookup': navigation.domainLookupEnd - navigation.domainLookupStart,
          'TCP Connection': navigation.connectEnd - navigation.connectStart,
          'Request': navigation.responseStart - navigation.requestStart,
          'Response': navigation.responseEnd - navigation.responseStart,
          'DOM Processing': navigation.domComplete - navigation.domLoading,
          'Total Load Time': navigation.loadEventEnd - navigation.navigationStart,
        })
      }

      // Monitor resource timings
      const resources = performance.getEntriesByType('resource')
      const slowResources = resources.filter((resource: any) => resource.duration > 1000)
      
      if (slowResources.length > 0) {
        console.warn('Slow Resources (>1s):', slowResources.map((r: any) => ({
          name: r.name,
          duration: r.duration,
          size: r.transferSize,
        })))
      }
    })
  }

  // Report metrics
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics)
  }

  // Clear metrics
  clear(): void {
    this.metrics.clear()
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.clearMarks()
      performance.clearMeasures()
    }
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const mark = (name: string) => performanceMonitor.mark(name)
  const measure = (name: string) => performanceMonitor.measure(name)
  const getMetrics = () => performanceMonitor.getMetrics()
  
  return { mark, measure, getMetrics }
}

// Bundle size analyzer (development only)
export function analyzeBundleSize() {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    let totalSize = 0
    
    const scripts = document.querySelectorAll('script[src]')
    const links = document.querySelectorAll('link[rel="stylesheet"]')
    
    console.group('Bundle Analysis')
    
    scripts.forEach((script: any) => {
      if (script.src && script.src.includes('/_next/')) {
        fetch(script.src, { method: 'HEAD' })
          .then((response) => {
            const size = parseInt(response.headers.get('content-length') || '0')
            totalSize += size
            console.log(`Script: ${script.src.split('/').pop()} - ${(size / 1024).toFixed(2)} KB`)
          })
          .catch(() => {})
      }
    })
    
    links.forEach((link: any) => {
      if (link.href && link.href.includes('/_next/')) {
        fetch(link.href, { method: 'HEAD' })
          .then((response) => {
            const size = parseInt(response.headers.get('content-length') || '0')
            totalSize += size
            console.log(`CSS: ${link.href.split('/').pop()} - ${(size / 1024).toFixed(2)} KB`)
          })
          .catch(() => {})
      }
    })
    
    setTimeout(() => {
      console.log(`Total estimated bundle size: ${(totalSize / 1024).toFixed(2)} KB`)
      console.groupEnd()
    }, 2000)
  }
}