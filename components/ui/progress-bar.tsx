"use client"

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  label?: string
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  animate?: boolean
  striped?: boolean
  animated?: boolean
}

const sizeMap = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4'
}

const colorMap = {
  primary: 'bg-primary',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500'
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  showValue = false,
  label,
  color = 'primary',
  animate = true,
  striped = false,
  animated = false
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm text-muted-foreground">{label}</span>}
          {showValue && <span className="text-sm font-medium">{Math.round(percentage)}%</span>}
        </div>
      )}
      
      <div className={cn(
        "w-full rounded-full bg-muted overflow-hidden",
        sizeMap[size]
      )}>
        <motion.div
          className={cn(
            "h-full rounded-full",
            colorMap[color],
            striped && "bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:1rem_1rem]",
            animated && striped && "animate-stripe"
          )}
          initial={animate ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}