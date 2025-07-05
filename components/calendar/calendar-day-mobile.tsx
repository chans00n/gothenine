"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { DayStatus } from "@/types/calendar"

interface CalendarDayProps {
  dayNumber: number
  date: Date | string
  status: DayStatus
  tasksCompleted?: number
  totalTasks?: number
  isCurrentDay?: boolean
  onClick?: () => void
  hidden?: boolean
}

export function CalendarDay({
  date,
  status,
  tasksCompleted = 0,
  totalTasks = 6,
  isCurrentDay = false,
  onClick,
  hidden = false
}: CalendarDayProps) {
  const getBackgroundColor = () => {
    if (hidden) return "opacity-20"
    
    switch (status) {
      case DayStatus.COMPLETE:
        return "bg-green-500 text-white"
      case DayStatus.INCOMPLETE:
        return "bg-red-500 text-white"
      case DayStatus.PARTIAL:
        return "bg-yellow-500 text-white"
      case DayStatus.SKIPPED:
        return "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
      case DayStatus.TODAY:
        return "bg-blue-500 text-white"
      case DayStatus.FUTURE:
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const isClickable = status !== DayStatus.FUTURE && !hidden

  return (
    <motion.button
      whileHover={isClickable ? { scale: 1.05 } : {}}
      whileTap={isClickable ? { scale: 0.95 } : {}}
      onClick={isClickable ? onClick : undefined}
      className={cn(
        "aspect-square rounded-lg flex flex-col items-center justify-center relative w-full",
        "transition-all text-xs font-medium",
        getBackgroundColor(),
        isCurrentDay && "ring-2 ring-offset-1 ring-blue-500",
        !isClickable && "cursor-not-allowed"
      )}
      disabled={!isClickable}
    >
      {/* Date */}
      <div className="text-sm font-bold">
        {typeof date === 'string' ? new Date(date).getDate() : date.getDate()}
      </div>
      
      {/* Progress indicator for partial days */}
      {status === DayStatus.PARTIAL && (
        <div className="absolute bottom-0.5 left-0 right-0 px-1">
          <div className="h-1 bg-black/20 dark:bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(tasksCompleted / totalTasks) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-white dark:bg-black"
            />
          </div>
        </div>
      )}

      {/* Current day pulse effect */}
      {isCurrentDay && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
        >
          <div className="absolute inset-0 rounded-lg bg-blue-500" />
        </motion.div>
      )}
    </motion.button>
  )
}