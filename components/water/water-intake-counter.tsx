'use client'

import { useState } from 'react'
import { useWaterIntake } from '@/hooks/use-water-intake'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Droplets, Plus, Minus, Waves, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface WaterIntakeCounterProps {
  challengeId: string
  className?: string
}

export function WaterIntakeCounter({ challengeId, className }: WaterIntakeCounterProps) {
  const [customAmount, setCustomAmount] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  
  const {
    amount,
    goal,
    percentage,
    isGoalMet,
    isLoading,
    isSaving,
    addWater,
    removeWater,
    quickAdd
  } = useWaterIntake({ 
    challengeId,
    onGoalMet: () => {
      // Could trigger confetti or celebration animation
    }
  })

  const handleCustomAdd = () => {
    const value = parseFloat(customAmount)
    if (!isNaN(value) && value > 0) {
      addWater(value, 'oz')
      setCustomAmount('')
      setShowCustom(false)
    }
  }

  const handleIncrement = () => addWater(8, 'oz') // 1 glass
  const handleDecrement = () => removeWater(8, 'oz')

  const remaining = Math.max(0, goal - amount)
  const glassesRemaining = Math.ceil(remaining / 8)

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Droplets className="h-8 w-8 animate-pulse text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5" />
          Water Intake
        </CardTitle>
        <CardDescription>
          Track your daily water intake - 1 gallon (128 oz) per day
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual Progress */}
        <div className="relative">
          {/* Water Glass Visual */}
          <div className="relative mx-auto w-32 h-40 border-4 border-primary/20 rounded-b-3xl overflow-hidden bg-background">
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-blue-500/20"
              animate={{ height: `${percentage}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-blue-600 to-blue-400 opacity-80" />
              <Waves className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-8 text-blue-300 animate-pulse" />
            </motion.div>
            
            {/* Amount Display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{amount}</div>
                <div className="text-xs text-muted-foreground">oz</div>
              </div>
            </div>
          </div>

          {/* Goal Status */}
          <AnimatePresence>
            {isGoalMet && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-2 -right-2 bg-green-600 rounded-full p-2"
              >
                <Check className="h-4 w-4 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{amount} oz</span>
            <span className="text-muted-foreground">{goal} oz</span>
          </div>
          <Progress value={percentage} className="h-2" />
          <div className="text-center text-sm text-muted-foreground">
            {isGoalMet ? (
              <span className="text-green-600 font-medium">Goal achieved! 🎉</span>
            ) : (
              <span>{remaining} oz remaining ({glassesRemaining} glasses)</span>
            )}
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => quickAdd('glass')}
            disabled={isSaving}
            className="flex flex-col h-auto py-3"
          >
            <span className="text-lg mb-1">🥤</span>
            <span className="text-xs">Glass</span>
            <span className="text-xs text-muted-foreground">8 oz</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => quickAdd('cup')}
            disabled={isSaving}
            className="flex flex-col h-auto py-3"
          >
            <span className="text-lg mb-1">☕</span>
            <span className="text-xs">Cup</span>
            <span className="text-xs text-muted-foreground">12 oz</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => quickAdd('bottle')}
            disabled={isSaving}
            className="flex flex-col h-auto py-3"
          >
            <span className="text-lg mb-1">🍶</span>
            <span className="text-xs">Bottle</span>
            <span className="text-xs text-muted-foreground">16 oz</span>
          </Button>
        </div>

        {/* Fine Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={handleDecrement}
            disabled={isSaving || amount === 0}
            aria-label="Remove 8 oz of water"
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCustom(!showCustom)}
              className="text-xs"
            >
              Custom Amount
            </Button>
          </div>
          
          <Button
            size="icon"
            variant="outline"
            onClick={handleIncrement}
            disabled={isSaving}
            aria-label="Add 8 oz of water"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Custom Amount Input */}
        <AnimatePresence>
          {showCustom && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <Label htmlFor="custom-amount">Custom amount (oz)</Label>
              <div className="flex gap-2">
                <Input
                  id="custom-amount"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Enter oz"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomAdd()}
                />
                <Button 
                  onClick={handleCustomAdd}
                  disabled={!customAmount || parseFloat(customAmount) <= 0 || isSaving}
                >
                  Add
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}