"use client"

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressRingProps {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  showValue?: boolean
  label?: string
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  animate?: boolean
}

const colorMap = {
  primary: 'stroke-primary',
  success: 'stroke-green-500',
  warning: 'stroke-yellow-500',
  danger: 'stroke-red-500',
  info: 'stroke-blue-500'
}

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 8,
  className,
  showValue = true,
  label,
  color = 'primary',
  animate = true
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={animate ? circumference : offset}
          strokeLinecap="round"
          className={cn("transition-all duration-500", colorMap[color])}
          initial={animate ? { strokeDashoffset: circumference } : false}
          animate={animate ? { strokeDashoffset: offset } : false}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <motion.span 
            className="text-2xl font-bold"
            initial={animate ? { opacity: 0, scale: 0.5 } : false}
            animate={animate ? { opacity: 1, scale: 1 } : false}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            {Math.round(value)}%
          </motion.span>
        )}
        {label && (
          <motion.span 
            className="text-xs text-muted-foreground mt-1"
            initial={animate ? { opacity: 0 } : false}
            animate={animate ? { opacity: 1 } : false}
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            {label}
          </motion.span>
        )}
      </div>
    </div>
  )
}