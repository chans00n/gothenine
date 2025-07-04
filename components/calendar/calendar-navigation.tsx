"use client"

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface CalendarNavigationProps {
  currentWeek: number
  totalWeeks: number
  onNavigate: (direction: 'prev' | 'next' | 'today') => void
  canGoPrev: boolean
  canGoNext: boolean
  weekRange: string
}

export function CalendarNavigation({
  currentWeek,
  totalWeeks,
  onNavigate,
  canGoPrev,
  canGoNext,
  weekRange
}: CalendarNavigationProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate('prev')}
          disabled={!canGoPrev}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('today')}
          className="gap-1"
        >
          <Calendar className="h-3 w-3" />
          Today
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate('next')}
          disabled={!canGoNext}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <motion.div
        key={weekRange}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="text-sm font-medium text-muted-foreground"
      >
        {weekRange}
      </motion.div>

      <div className="text-sm text-muted-foreground">
        Week {currentWeek} of {totalWeeks}
      </div>
    </div>
  )
}