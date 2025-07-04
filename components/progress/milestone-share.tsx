"use client"

import { useState, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Share2, Twitter, Facebook, Link, Check, Download, Trophy, Zap, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { AchievementBadge, type BadgeType } from '@/components/ui/achievement-badge'
import { ChartConfig, ChartContainer } from '@/components/ui/chart'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

// Dynamically import recharts to avoid SSR issues
const RadialBarChart = lazy(() => import('recharts').then(module => ({ default: module.RadialBarChart })))
const RadialBar = lazy(() => import('recharts').then(module => ({ default: module.RadialBar })))
const PolarGrid = lazy(() => import('recharts').then(module => ({ default: module.PolarGrid })))
const PolarRadiusAxis = lazy(() => import('recharts').then(module => ({ default: module.PolarRadiusAxis })))
const Label = lazy(() => import('recharts').then(module => ({ default: module.Label })))

interface MilestoneShareProps {
  milestone: {
    day: number
    label: string
    description: string
    iconName: 'target' | 'trophy' | 'zap'
    badge?: BadgeType
  }
  currentDay: number
  userName?: string
  className?: string
}

const iconMap = {
  target: Target,
  trophy: Trophy,
  zap: Zap
}

const milestoneMessages: Record<number, string> = {
  1: "Started my 75 Hard journey! Day 1 complete! 💪",
  7: "One week down! Building momentum on my 75 Hard journey! 🔥",
  14: "Two weeks strong! The habit is forming! 💯",
  21: "Three weeks in! Neural pathways are changing! 🧠",
  30: "One month milestone achieved! This is becoming my lifestyle! 🏆",
  38: "Halfway there! 38 days of pure dedication! 🎯",
  50: "50 days complete! The final stretch begins! 💪",
  60: "60 days down! So close to the finish! 🚀",
  75: "I DID IT! 75 Hard COMPLETE! Mental toughness achieved! 🏆🎉"
}

export function MilestoneShare({ milestone, currentDay, userName = "User", className }: MilestoneShareProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const shareText = milestoneMessages[milestone.day] || 
    `Just hit Day ${milestone.day} of my 75 Hard journey! ${milestone.description} 💪`
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const Icon = iconMap[milestone.iconName]

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    window.open(twitterUrl, '_blank')
  }

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`
    window.open(facebookUrl, '_blank')
  }

  const handleDownloadImage = async () => {
    setIsSharing(true)
    try {
      const element = document.getElementById(`milestone-share-card-${milestone.day}`)
      if (!element) return

      // Dynamically import html2canvas to avoid build issues
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      })

      const link = document.createElement('a')
      link.download = `75hard-milestone-day-${milestone.day}.png`
      link.href = canvas.toDataURL()
      link.click()

      toast.success('Milestone image downloaded!')
    } catch (error) {
      toast.error('Failed to download image')
    } finally {
      setIsSharing(false)
    }
  }

  const handleNativeShare = async () => {
    if (!navigator.share) {
      toast.error('Sharing not supported on this device')
      return
    }

    setIsSharing(true)
    try {
      const element = document.getElementById(`milestone-share-card-${milestone.day}`)
      if (!element) return

      // Dynamically import html2canvas to avoid build issues
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      })

      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Failed to create image')
          return
        }

        const file = new File([blob], `75hard-milestone-day-${milestone.day}.png`, {
          type: 'image/png'
        })

        try {
          await navigator.share({
            title: `75 Hard - ${milestone.label}`,
            text: shareText,
            files: [file]
          })
          toast.success('Shared successfully!')
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            toast.error('Failed to share')
          }
        }
      })
    } catch (error) {
      toast.error('Failed to create share image')
    } finally {
      setIsSharing(false)
    }
  }

  const progress = Math.min(100, (currentDay / milestone.day) * 100)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("h-8 px-2", className)}>
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share {milestone.label} Milestone</DialogTitle>
          <DialogDescription>
            Celebrate reaching this important milestone!
          </DialogDescription>
        </DialogHeader>

        {/* Milestone Card */}
        <div
          id={`milestone-share-card-${milestone.day}`}
          className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg p-8 space-y-6 relative overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 20% 80%, var(--primary) 0%, transparent 50%),
                               radial-gradient(circle at 80% 20%, var(--primary) 0%, transparent 50%)`
            }} />
          </div>

          <div className="text-center relative z-10">
            <motion.div 
              className="inline-flex p-4 rounded-full bg-primary/10 mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Icon className="h-12 w-12 text-primary" />
            </motion.div>
            <h3 className="text-3xl font-bold mb-2">{milestone.label}</h3>
            <p className="text-lg text-muted-foreground">{milestone.description}</p>
          </div>

          <div className="flex justify-center relative z-10">
            <div className="w-[200px] h-[200px]">
              <ChartContainer
                config={{
                  value: {
                    label: 'Progress',
                    color: milestone.day === 75 ? '#22c55e' : 'var(--chart-1)'
                  }
                } satisfies ChartConfig}
                className="w-full h-full"
              >
                <Suspense fallback={<Skeleton className="w-full h-full rounded-full" />}>
                  <RadialBarChart
                    data={[{
                      value: progress,
                      fill: milestone.day === 75 ? '#22c55e' : 'var(--chart-1)'
                    }]}
                    startAngle={90}
                    endAngle={450}
                    innerRadius={70}
                    outerRadius={90}
                  >
                    <PolarGrid
                      gridType="circle"
                      radialLines={false}
                      stroke="none"
                      className="first:fill-muted last:fill-background"
                      polarRadius={[76, 64]}
                    />
                    <RadialBar 
                      dataKey="value" 
                      background
                      cornerRadius={10}
                      fill={milestone.day === 75 ? '#22c55e' : 'var(--chart-1)'}
                      maxBarSize={10}
                    />
                    <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy - 10}
                                  className="fill-foreground text-4xl font-bold"
                                >
                                  Day {milestone.day}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 15}
                                  className="fill-muted-foreground text-sm"
                                >
                                  {milestone.day === 75 ? 'COMPLETE!' : 'Reached!'}
                                </tspan>
                              </text>
                            )
                          }
                        }}
                      />
                    </PolarRadiusAxis>
                  </RadialBarChart>
                </Suspense>
              </ChartContainer>
            </div>
          </div>

          {milestone.badge && (
            <div className="flex justify-center relative z-10">
              <AchievementBadge
                type={milestone.badge}
                size="lg"
                unlocked
                showLabel
                animate={false}
              />
            </div>
          )}

          <div className="text-center relative z-10">
            <p className="text-lg font-medium mb-2">{userName}'s 75 Hard Journey</p>
            <div className="text-sm text-muted-foreground">
              <div className="font-medium mb-1">75hard-tracker.app</div>
              <div>#75Hard #{milestone.label.replace(/\s+/g, '')}</div>
            </div>
          </div>
        </div>

        {/* Share Options */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handleTwitterShare}
              className="w-full"
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button
              variant="outline"
              onClick={handleFacebookShare}
              className="w-full"
            >
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="w-full"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Link className="h-4 w-4 mr-2" />
                Copy Link
              </>
            )}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleDownloadImage}
              disabled={isSharing}
              variant="outline"
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            {navigator.share && (
              <Button
                onClick={handleNativeShare}
                disabled={isSharing}
                className="w-full"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}