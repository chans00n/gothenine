import { lazy, Suspense, ComponentType } from 'react'
import { Card, CardContent } from '@/components/ui/card'

// Loading fallback component
export function LoadingFallback({ 
  height = 'h-32', 
  text = 'Loading...' 
}: { 
  height?: string
  text?: string 
}) {
  return (
    <Card className={`${height} animate-pulse`}>
      <CardContent className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground">{text}</div>
      </CardContent>
    </Card>
  )
}

// Skeleton loader for different component types
export function SkeletonLoader({ 
  type = 'card',
  count = 1 
}: { 
  type?: 'card' | 'list' | 'grid' | 'calendar'
  count?: number 
}) {
  const skeletons = Array.from({ length: count }, (_, i) => {
    switch (type) {
      case 'list':
        return (
          <div key={i} className="flex items-center space-x-4 p-4">
            <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
            </div>
          </div>
        )
      
      case 'grid':
        return (
          <div key={i} className="space-y-3">
            <div className="h-32 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
          </div>
        )
      
      case 'calendar':
        return (
          <div key={i} className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, j) => (
              <div key={j} className="h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
        )
      
      default: // card
        return (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-6 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        )
    }
  })

  return <>{skeletons}</>
}

// Higher-order component for lazy loading with custom fallback
export function withLazyLoading<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  fallback?: ComponentType,
  errorBoundary?: ComponentType
) {
  const LazyComponent = lazy(importFunc)
  const FallbackComponent = fallback || (() => <LoadingFallback />)

  return function LazyLoadedComponent(props: P) {
    const content = (
      <Suspense fallback={<FallbackComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    )

    if (errorBoundary) {
      const ErrorBoundary = errorBoundary
      return <ErrorBoundary>{content}</ErrorBoundary>
    }

    return content
  }
}

// Intersection Observer hook for lazy loading on scroll
export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) {
  const observer = typeof window !== 'undefined' 
    ? new IntersectionObserver(callback, {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      })
    : null

  const observe = (element: Element) => {
    if (observer && element) {
      observer.observe(element)
    }
  }

  const unobserve = (element: Element) => {
    if (observer && element) {
      observer.unobserve(element)
    }
  }

  const disconnect = () => {
    if (observer) {
      observer.disconnect()
    }
  }

  return { observe, unobserve, disconnect }
}

// Lazy image component with intersection observer
export function LazyImage({
  src,
  alt,
  className,
  placeholder,
  ...props
}: {
  src: string
  alt: string
  className?: string
  placeholder?: string
} & React.ImgHTMLAttributes<HTMLImageElement>) {
  const { observe, unobserve } = useIntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          if (img.dataset.src) {
            img.src = img.dataset.src
            img.removeAttribute('data-src')
            unobserve(img)
          }
        }
      })
    }
  )

  return (
    <img
      ref={(el) => {
        if (el) observe(el)
      }}
      data-src={src}
      src={placeholder || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y0ZjRmNCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TG9hZGluZy4uLjwvdGV4dD48L3N2Zz4='}
      alt={alt}
      className={className}
      {...props}
    />
  )
}

// Preload critical components
export const preloadComponents = {
  Dashboard: () => import('@/app/(authenticated)/dashboard/page'),
  Calendar: () => import('@/app/(authenticated)/calendar/page'),
  Progress: () => import('@/app/(authenticated)/progress/page'),
  Settings: () => import('@/app/(authenticated)/settings/page'),
  Timer: () => import('@/app/(authenticated)/timer/page'),
}

// Preload function to warm up lazy components
export function preloadCriticalComponents() {
  if (typeof window !== 'undefined') {
    // Preload on idle or after a delay
    const preload = () => {
      Object.values(preloadComponents).forEach(importFunc => {
        importFunc().catch(() => {
          // Silently fail - component will load when needed
        })
      })
    }

    if ('requestIdleCallback' in window) {
      requestIdleCallback(preload)
    } else {
      setTimeout(preload, 2000)
    }
  }
}