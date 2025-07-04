"use client"

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Award, Trophy, Star, Target, Zap, Flame, Medal, Crown } from 'lucide-react'

export type BadgeType = 'first-day' | 'week-warrior' | 'fortnight' | 'month-master' | 
  'halfway' | 'final-stretch' | 'champion' | 'perfect-week' | 'comeback' | 'early-bird'

interface BadgeConfig {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  color: string
  bgColor: string
}

const badgeConfigs: Record<BadgeType, BadgeConfig> = {
  'first-day': {
    icon: Star,
    label: 'First Day',
    description: 'Completed your first day!',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-950/30'
  },
  'week-warrior': {
    icon: Award,
    label: '7 Day Streak',
    description: 'One week strong!',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-950/30'
  },
  'fortnight': {
    icon: Medal,
    label: '14 Day Streak',
    description: 'Two weeks of dedication!',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-950/30'
  },
  'month-master': {
    icon: Trophy,
    label: '30 Day Streak',
    description: 'One month milestone!',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-950/30'
  },
  'halfway': {
    icon: Target,
    label: 'Halfway Hero',
    description: '38 days complete!',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-950/30'
  },
  'final-stretch': {
    icon: Zap,
    label: 'Final Stretch',
    description: '60 days done!',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-950/30'
  },
  'champion': {
    icon: Crown,
    label: '75 Hard Champion',
    description: 'You did it! 75 days complete!',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-950/30'
  },
  'perfect-week': {
    icon: Flame,
    label: 'Perfect Week',
    description: '7 days, all tasks complete!',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-950/30'
  },
  'comeback': {
    icon: Zap,
    label: 'Comeback Kid',
    description: 'Back on track after a break!',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100 dark:bg-teal-950/30'
  },
  'early-bird': {
    icon: Star,
    label: 'Early Bird',
    description: 'Completed before noon!',
    color: 'text-sky-600',
    bgColor: 'bg-sky-100 dark:bg-sky-950/30'
  }
}

interface AchievementBadgeProps {
  type: BadgeType
  unlocked?: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animate?: boolean
  onClick?: () => void
}

const sizeMap = {
  sm: { icon: 'h-6 w-6', container: 'h-12 w-12', text: 'text-xs' },
  md: { icon: 'h-8 w-8', container: 'h-16 w-16', text: 'text-sm' },
  lg: { icon: 'h-10 w-10', container: 'h-20 w-20', text: 'text-base' }
}

export function AchievementBadge({
  type,
  unlocked = false,
  size = 'md',
  showLabel = true,
  animate = true,
  onClick
}: AchievementBadgeProps) {
  const config = badgeConfigs[type]
  const Icon = config.icon
  const sizes = sizeMap[size]

  return (
    <motion.div
      className={cn(
        "flex flex-col items-center gap-2 cursor-pointer",
        !unlocked && "opacity-40 grayscale"
      )}
      whileHover={unlocked ? { scale: 1.05 } : {}}
      whileTap={unlocked ? { scale: 0.95 } : {}}
      initial={animate && unlocked ? { scale: 0, opacity: 0 } : false}
      animate={animate && unlocked ? { scale: 1, opacity: 1 } : false}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      onClick={onClick}
    >
      <div className={cn(
        "relative flex items-center justify-center rounded-full",
        sizes.container,
        unlocked ? config.bgColor : "bg-muted"
      )}>
        <Icon className={cn(
          sizes.icon,
          unlocked ? config.color : "text-muted-foreground"
        )} />
        
        {unlocked && animate && (
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
            style={{
              background: `radial-gradient(circle, ${config.color.replace('text-', 'rgb(var(--color-')})` + '/20) 0%, transparent 70%)'
            }}
          />
        )}
      </div>
      
      {showLabel && (
        <div className="text-center">
          <p className={cn("font-medium", sizes.text)}>{config.label}</p>
          {size !== 'sm' && (
            <p className={cn("text-muted-foreground", 
              size === 'lg' ? 'text-sm' : 'text-xs'
            )}>
              {config.description}
            </p>
          )}
        </div>
      )}
    </motion.div>
  )
}