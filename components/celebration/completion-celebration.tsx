'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Trophy, Star, Flame, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CompletionCelebrationProps {
  show: boolean
  dayNumber: number
  totalDays?: number
  streakCount?: number
  onClose: () => void
  className?: string
}

export function CompletionCelebration({
  show,
  dayNumber,
  totalDays = 75,
  streakCount = 1,
  onClose,
  className
}: CompletionCelebrationProps) {
  const [hasShownConfetti, setHasShownConfetti] = useState(false)

  useEffect(() => {
    if (show && !hasShownConfetti) {
      // Trigger confetti
      const duration = 3000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      }, 250)

      setHasShownConfetti(true)
    }
  }, [show, hasShownConfetti])

  const isMilestone = dayNumber % 10 === 0 || dayNumber === 1 || dayNumber === totalDays
  const isComplete = dayNumber === totalDays

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm",
            className
          )}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="w-full max-w-md p-8 text-center relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/20 via-orange-100/20 to-red-100/20 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-red-900/20" />
              
              <div className="relative z-10 space-y-6">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", damping: 10 }}
                  className="mx-auto"
                >
                  {isComplete ? (
                    <Trophy className="h-20 w-20 text-yellow-500 mx-auto" />
                  ) : isMilestone ? (
                    <Star className="h-20 w-20 text-orange-500 mx-auto" />
                  ) : (
                    <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
                  )}
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold"
                >
                  {isComplete ? "🎉 Challenge Complete! 🎉" : isMilestone ? "🌟 Milestone Reached! 🌟" : "✅ Day Complete! ✅"}
                </motion.h2>

                {/* Message */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <p className="text-xl font-semibold">
                    Day {dayNumber} of {totalDays}
                  </p>
                  {isComplete ? (
                    <p className="text-muted-foreground">
                      You've completed the entire 75 Hard challenge! You are a true champion!
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      Amazing work! You've completed all your tasks for today.
                    </p>
                  )}
                </motion.div>

                {/* Streak info */}
                {streakCount > 1 && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-center gap-2 text-orange-600 dark:text-orange-400"
                  >
                    <Flame className="h-5 w-5" />
                    <span className="font-semibold">{streakCount} Day Streak!</span>
                  </motion.div>
                )}

                {/* Progress bar */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="w-full bg-muted rounded-full h-3 overflow-hidden"
                >
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-1000"
                    style={{ width: `${(dayNumber / totalDays) * 100}%` }}
                  />
                </motion.div>

                {/* Action button */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button 
                    onClick={onClose}
                    size="lg"
                    className="w-full"
                  >
                    {isComplete ? "Start New Journey" : "Continue Tomorrow"}
                  </Button>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}