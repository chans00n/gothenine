"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { DayStatus } from "@/types/calendar"
import { 
  CheckCircle2, 
  XCircle, 
  Circle,
  AlertCircle,
  MinusCircle
} from "lucide-react"

interface CalendarDayProps {
  dayNumber: number
  date: Date | string
  status: DayStatus
  tasksCompleted?: number
  totalTasks?: number
  isCurrentDay?: boolean
  onClick?: () => void
  isSelected?: boolean
}

export function CalendarDay({
  dayNumber,
  date,
  status,
  tasksCompleted = 0,
  totalTasks = 6,
  isCurrentDay = false,
  onClick,
  isSelected = false
}: CalendarDayProps) {
  const getStatusIcon = () => {
    switch (status) {
      case DayStatus.COMPLETE:
        return <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-600 drop-shadow-sm" />
      case DayStatus.INCOMPLETE:
        return <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600 drop-shadow-sm" />
      case DayStatus.PARTIAL:
        return <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-yellow-600 drop-shadow-sm" />
      case DayStatus.SKIPPED:
        return <MinusCircle className="h-4 w-4 md:h-5 md:w-5 text-gray-500" />
      case DayStatus.TODAY:
        return <Circle className="h-4 w-4 md:h-5 md:w-5 text-blue-600 animate-pulse" />
      case DayStatus.FUTURE:
      default:
        return <Circle className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground/50" />
    }
  }

  const getBackgroundColor = () => {
    switch (status) {
      case DayStatus.COMPLETE:
        return "bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 hover:from-green-100 hover:to-green-200/50 dark:hover:from-green-900/30 dark:hover:to-green-800/20 border-green-500/30 shadow-sm"
      case DayStatus.INCOMPLETE:
        return "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10 hover:from-red-100 hover:to-red-200/50 dark:hover:from-red-900/30 dark:hover:to-red-800/20 border-red-500/30"
      case DayStatus.PARTIAL:
        return "bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/20 dark:to-yellow-900/10 hover:from-yellow-100 hover:to-yellow-200/50 dark:hover:from-yellow-900/30 dark:hover:to-yellow-800/20 border-yellow-500/30"
      case DayStatus.SKIPPED:
        return "bg-gray-100/50 dark:bg-gray-900/20 hover:bg-gray-200/50 dark:hover:bg-gray-800/30 border-gray-300 dark:border-gray-700"
      case DayStatus.TODAY:
        return "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 hover:from-blue-100 hover:to-blue-200/50 dark:hover:from-blue-900/30 dark:hover:to-blue-800/20 border-blue-500 shadow-md"
      case DayStatus.FUTURE:
      default:
        return "bg-muted/30 hover:bg-muted/50 border-border/50 opacity-60"
    }
  }

  const progressPercentage = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0

  return (
    <motion.button
      whileHover={{ scale: status !== DayStatus.FUTURE ? 1.05 : 1 }}
      whileTap={{ scale: status !== DayStatus.FUTURE ? 0.95 : 1 }}
      onClick={onClick}
      className={cn(
        "relative p-2 md:p-3 rounded-lg border-2 transition-all",
        "flex flex-col items-center justify-center",
        "min-h-[70px] md:min-h-[90px]",
        getBackgroundColor(),
        isCurrentDay && "ring-2 ring-blue-500 ring-offset-2 ring-offset-background",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        status === DayStatus.FUTURE && "cursor-not-allowed"
      )}
      disabled={status === DayStatus.FUTURE}
    >
      {/* Status Icon - Top Right */}
      <div className="absolute top-1 right-1">
        {getStatusIcon()}
      </div>

      {/* Date - Large and centered */}
      <div className="text-xl md:text-2xl font-bold">
        {typeof date === 'string' ? new Date(date).getDate() : date.getDate()}
      </div>

      {/* Day Number - Small below date */}
      <div className="text-[10px] md:text-xs font-medium text-muted-foreground mt-1">
        Day {dayNumber}
      </div>

      {/* Progress Indicator */}
      {status === DayStatus.PARTIAL && (
        <div className="absolute bottom-0 left-0 right-0 px-1 pb-1">
          <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
            />
          </div>
          <div className="text-[10px] text-center mt-0.5 font-medium">
            {tasksCompleted}/{totalTasks}
          </div>
        </div>
      )}

      {/* Completion Badge for perfect days */}
      {status === DayStatus.COMPLETE && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
        >
          <span className="text-[10px] font-bold">✓</span>
        </motion.div>
      )}

      {/* Current Day Indicator */}
      {isCurrentDay && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
        >
          <div className="absolute inset-0 rounded-lg bg-blue-500/20" />
        </motion.div>
      )}
    </motion.button>
  )
}

export function CalendarDaySkeleton() {
  return (
    <div className="p-2 md:p-3 rounded-lg border bg-muted/50 min-h-[60px] md:min-h-[80px]">
      <div className="animate-pulse space-y-2">
        <div className="h-3 w-8 bg-muted rounded mx-auto" />
        <div className="h-6 w-6 bg-muted rounded mx-auto" />
        <div className="h-4 w-4 bg-muted rounded mx-auto" />
      </div>
    </div>
  )
}