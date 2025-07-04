"use client"

import { motion, AnimatePresence, Variants } from 'framer-motion'
import { useEffect, useState } from 'react'

// Animation variants for common interactions
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
}

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
}

export const bounceIn: Variants = {
  hidden: { opacity: 0, scale: 0.3 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 20
    } 
  }
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

// Animated wrapper components
export function FadeInUp({ 
  children, 
  delay = 0, 
  className 
}: { 
  children: React.ReactNode
  delay?: number
  className?: string 
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeInUp}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function SlideInLeft({ 
  children, 
  delay = 0, 
  className 
}: { 
  children: React.ReactNode
  delay?: number
  className?: string 
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={slideInLeft}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function ScaleIn({ 
  children, 
  delay = 0, 
  className 
}: { 
  children: React.ReactNode
  delay?: number
  className?: string 
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={scaleIn}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggeredList({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggeredItem({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <motion.div
      variants={staggerItem}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Interactive button with micro-interactions
export function InteractiveButton({ 
  children, 
  onClick, 
  className,
  disabled = false,
  ...props 
}: { 
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// Floating action button with pulse animation
export function FloatingActionButton({ 
  children, 
  onClick, 
  className,
  pulse = false 
}: { 
  children: React.ReactNode
  onClick?: () => void
  className?: string
  pulse?: boolean
}) {
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={className}
    >
      <motion.div
        animate={pulse ? { scale: [1, 1.1, 1] } : {}}
        transition={pulse ? { repeat: Infinity, duration: 2 } : {}}
      >
        {children}
      </motion.div>
    </motion.button>
  )
}

// Progress indicator with smooth animations
export function AnimatedProgress({ 
  value, 
  max = 100, 
  className,
  showPercentage = false 
}: { 
  value: number
  max?: number
  className?: string
  showPercentage?: boolean
}) {
  const percentage = (value / max) * 100

  return (
    <div className={className}>
      <div className="relative w-full bg-muted rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      {showPercentage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground mt-1"
        >
          {Math.round(percentage)}%
        </motion.div>
      )}
    </div>
  )
}

// Checkbox with smooth animation
export function AnimatedCheckbox({ 
  checked, 
  onChange, 
  className 
}: { 
  checked: boolean
  onChange?: (checked: boolean) => void
  className?: string
}) {
  return (
    <motion.div
      className={`relative w-5 h-5 border-2 border-primary rounded cursor-pointer ${className}`}
      onClick={() => onChange?.(!checked)}
      whileTap={{ scale: 0.9 }}
    >
      <AnimatePresence>
        {checked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute inset-0 bg-primary rounded flex items-center justify-center"
          >
            <motion.svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <motion.path
                d="M2 6L5 9L10 3"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Toast notification with slide animation
export function AnimatedToast({ 
  children, 
  visible, 
  onClose, 
  className 
}: { 
  children: React.ReactNode
  visible: boolean
  onClose?: () => void
  className?: string
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={className}
          onClick={onClose}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Skeleton loader with shimmer effect
export function ShimmerSkeleton({ 
  className,
  lines = 1 
}: { 
  className?: string
  lines?: number
}) {
  return (
    <div className={className}>
      {Array.from({ length: lines }, (_, i) => (
        <motion.div
          key={i}
          className="relative bg-muted rounded h-4 mb-2 overflow-hidden"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          />
        </motion.div>
      ))}
    </div>
  )
}

// Confetti celebration animation
export function Confetti({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([])

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][Math.floor(Math.random() * 5)]
      }))
      
      setParticles(newParticles)
      
      setTimeout(() => setParticles([]), 3000)
    }
  }, [trigger])

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ 
              x: particle.x, 
              y: particle.y, 
              opacity: 1, 
              scale: 1 
            }}
            animate={{ 
              y: particle.y + 200, 
              opacity: 0, 
              scale: 0,
              rotate: 360 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="absolute w-2 h-2 rounded"
            style={{ backgroundColor: particle.color }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}