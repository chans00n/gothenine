"use client"

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Trophy, Star, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressCelebrationProps {
  show: boolean
  type: 'task' | 'day' | 'milestone' | 'complete'
  message: string
  onComplete?: () => void
}

export function ProgressCelebration({
  show,
  type,
  message,
  onComplete
}: ProgressCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      
      // Trigger confetti based on celebration type
      if (type === 'complete') {
        // Epic celebration for completing 75 Hard
        const duration = 5 * 1000
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

          const particleCount = 100 * (timeLeft / duration)
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
      } else if (type === 'milestone') {
        // Milestone celebration
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
      } else if (type === 'day') {
        // Day complete celebration
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        })
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        })
      }

      // Auto-hide after delay
      const timer = setTimeout(() => {
        setIsVisible(false)
        onComplete?.()
      }, type === 'complete' ? 6000 : 3000)

      return () => clearTimeout(timer)
    }
  }, [show, type, onComplete])

  const icons = {
    task: Sparkles,
    day: Star,
    milestone: Trophy,
    complete: Trophy
  }

  const Icon = icons[type]

  const colors = {
    task: 'from-blue-500 to-purple-600',
    day: 'from-green-500 to-emerald-600',
    milestone: 'from-orange-500 to-red-600',
    complete: 'from-yellow-400 to-orange-600'
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={cn(
              "bg-gradient-to-br text-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 pointer-events-auto",
              colors[type]
            )}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20
            }}
          >
            <motion.div
              className="flex flex-col items-center text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 0.5,
                  repeat: type === 'complete' ? Infinity : 2,
                  repeatDelay: 1
                }}
              >
                <Icon className="h-16 w-16 mb-4" />
              </motion.div>
              
              <h2 className={cn(
                "font-bold mb-2",
                type === 'complete' ? "text-4xl" : "text-2xl"
              )}>
                {type === 'complete' ? "CHAMPION!" : "Great Job!"}
              </h2>
              
              <p className={cn(
                "font-medium",
                type === 'complete' ? "text-xl" : "text-lg"
              )}>
                {message}
              </p>
              
              {type === 'complete' && (
                <motion.p
                  className="mt-4 text-sm opacity-90"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  You are stronger than you were 75 days ago!
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}