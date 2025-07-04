import { cn } from '@/lib/utils'

// Screen reader only content
export function ScreenReaderOnly({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <span 
      className={cn(
        "absolute -inset-[1px] h-[1px] w-[1px] overflow-hidden whitespace-nowrap border-0 p-0",
        "clip-[rect(0,0,0,0)]", // For older browsers
        className
      )}
    >
      {children}
    </span>
  )
}

// Live region for announcements
export function LiveRegion({ 
  children, 
  priority = 'polite',
  atomic = true,
  className 
}: { 
  children: React.ReactNode
  priority?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  className?: string 
}) {
  return (
    <div
      aria-live={priority}
      aria-atomic={atomic}
      className={cn("sr-only", className)}
    >
      {children}
    </div>
  )
}

// Skip link for keyboard navigation
export function SkipLink({ href = "#main", children = "Skip to main content" }: {
  href?: string
  children?: React.ReactNode
}) {
  return (
    <a
      href={href}
      className={cn(
        "absolute left-4 top-4 z-50 rounded bg-primary px-4 py-2 text-primary-foreground",
        "transition-transform duration-200",
        "-translate-y-16 focus:translate-y-0"
      )}
    >
      {children}
    </a>
  )
}

// Focus trap for modal dialogs
export function FocusTrap({ 
  children, 
  active = true 
}: { 
  children: React.ReactNode
  active?: boolean 
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!active || e.key !== 'Tab') return

    const focusableElements = e.currentTarget.querySelectorAll(
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    )
    
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }

  return (
    <div onKeyDown={handleKeyDown}>
      {children}
    </div>
  )
}

// Accessible status component
export function Status({ 
  children, 
  type = 'status',
  className 
}: { 
  children: React.ReactNode
  type?: 'status' | 'alert' | 'log'
  className?: string 
}) {
  return (
    <div
      role={type}
      aria-live={type === 'alert' ? 'assertive' : 'polite'}
      className={className}
    >
      {children}
    </div>
  )
}