"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  label?: string
}

// Basic spinner with Lucide icon
export function Spinner({ size = "md", className, label }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  }

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      {label && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
    </div>
  )
}

// Dots spinner
export function DotsSpinner({ size = "md", className }: SpinnerProps) {
  const sizeMap = {
    sm: { dot: 2, gap: 4 },
    md: { dot: 3, gap: 6 },
    lg: { dot: 4, gap: 8 },
    xl: { dot: 6, gap: 12 }
  }

  const { dot, gap } = sizeMap[size]

  return (
    <div className={cn("flex items-center", className)} style={{ gap: `${gap}px` }}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="rounded-full bg-primary"
          style={{ width: `${dot * 2}px`, height: `${dot * 2}px` }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: index * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

// Pulse spinner
export function PulseSpinner({ size = "md", className }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-24 w-24"
  }

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <motion.div
        className="absolute inset-0 rounded-full bg-primary"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <div className="absolute inset-0 rounded-full bg-primary opacity-50" />
    </div>
  )
}

// Progress spinner
export function ProgressSpinner({ 
  size = "md", 
  progress = 0,
  className 
}: SpinnerProps & { progress?: number }) {
  const sizeMap = {
    sm: { size: 32, stroke: 3 },
    md: { size: 48, stroke: 4 },
    lg: { size: 64, stroke: 5 },
    xl: { size: 96, stroke: 6 }
  }

  const { size: svgSize, stroke } = sizeMap[size]
  const radius = (svgSize - stroke) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className={cn("relative", className)}>
      <svg
        className="transform -rotate-90"
        width={svgSize}
        height={svgSize}
      >
        {/* Background circle */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-muted"
        />
        {/* Progress circle */}
        <motion.circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          className="text-primary"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-medium">{Math.round(progress)}%</span>
      </div>
    </div>
  )
}

// Full page loading
export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <DotsSpinner size="lg" />
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      </div>
    </div>
  )
}

// Inline loading state
export function InlineLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <Spinner size="sm" />
      <span>Loading...</span>
    </div>
  )
}

// Button loading state
export function ButtonLoader({ 
  loading,
  children,
  loadingText = "Loading..."
}: { 
  loading: boolean
  children: React.ReactNode
  loadingText?: string
}) {
  if (loading) {
    return (
      <>
        <Spinner size="sm" className="mr-2" />
        {loadingText}
      </>
    )
  }
  return <>{children}</>
}