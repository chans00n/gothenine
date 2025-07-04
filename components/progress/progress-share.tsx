"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Share2, Twitter, Facebook, Link, Check, Download } from 'lucide-react'
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
import { Calendar, Trophy, TrendingUp } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Dynamically import recharts to avoid SSR issues
const RadialBarChart = lazy(() => import('recharts').then(module => ({ default: module.RadialBarChart })))
const RadialBar = lazy(() => import('recharts').then(module => ({ default: module.RadialBar })))
const PolarGrid = lazy(() => import('recharts').then(module => ({ default: module.PolarGrid })))
const PolarRadiusAxis = lazy(() => import('recharts').then(module => ({ default: module.PolarRadiusAxis })))
const Label = lazy(() => import('recharts').then(module => ({ default: module.Label })))

interface ProgressShareProps {
  stats: {
    daysComplete: number
    currentStreak: number
    completionRate: number
    badges: BadgeType[]
  }
  userName?: string
}

export function ProgressShare({ stats, userName = "User" }: ProgressShareProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareText = `I'm ${stats.daysComplete} days into my 75 Hard journey! 💪 Current streak: ${stats.currentStreak} days | Completion rate: ${stats.completionRate}%`
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : ''

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
      const element = document.getElementById('progress-share-card')
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
      link.download = `75hard-progress-day-${stats.daysComplete}.png`
      link.href = canvas.toDataURL()
      link.click()

      toast.success('Progress image downloaded!')
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
      const element = document.getElementById('progress-share-card')
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

        const file = new File([blob], `75hard-progress-day-${stats.daysComplete}.png`, {
          type: 'image/png'
        })

        try {
          await navigator.share({
            title: '75 Hard Progress',
            text: shareText,
            files: [file]
          })
          toast.success('Shared successfully!')
        } catch (error) {
          // User cancelled the share
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs sm:text-sm">
          <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          <span className="hidden sm:inline">Share Progress</span>
          <span className="sm:hidden">Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Your Progress</DialogTitle>
          <DialogDescription>
            Share your 75 Hard journey with friends and family
          </DialogDescription>
        </DialogHeader>

        {/* Preview Card */}
        <div
          id="progress-share-card"
          className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-8 space-y-6 relative overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                currentColor,
                currentColor 10px,
                transparent 10px,
                transparent 20px
              )`
            }} />
          </div>
          <div className="text-center relative z-10">
            <h3 className="text-2xl font-bold mb-1">{userName}&apos;s 75 Hard Progress</h3>
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4" />
              Day {stats.daysComplete} of 75
            </p>
          </div>

          <div className="flex justify-center relative z-10">
            <div className="w-[200px] h-[200px]">
              <Suspense fallback={<Skeleton className="h-full w-full rounded-full" />}>
                <ChartContainer
                  config={{
                    value: {
                      label: 'Progress',
                      color: 'var(--chart-1)'
                    }
                  } satisfies ChartConfig}
                  className="w-full h-full"
                >
                  <RadialBarChart
                    data={[{
                      value: stats.completionRate,
                      fill: 'var(--chart-1)'
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
                      fill="var(--chart-1)"
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
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {stats.completionRate}%
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 20}
                                className="fill-muted-foreground text-sm"
                              >
                                Complete
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </PolarRadiusAxis>
                  </RadialBarChart>
                </ChartContainer>
              </Suspense>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center relative z-10">
            <div className="bg-background/50 rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <p className="text-3xl font-bold">{stats.currentStreak}</p>
              <p className="text-sm text-muted-foreground">Current Streak</p>
            </div>
            <div className="bg-background/50 rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <p className="text-3xl font-bold">{stats.daysComplete}</p>
              <p className="text-sm text-muted-foreground">Days Complete</p>
            </div>
          </div>

          {stats.badges.length > 0 && (
            <div className="relative z-10">
              <p className="text-sm font-medium mb-3 text-center">Recent Achievements</p>
              <div className="flex gap-3 justify-center">
                {stats.badges.slice(-3).map((badge) => (
                  <AchievementBadge
                    key={badge}
                    type={badge}
                    size="sm"
                    unlocked
                    showLabel={false}
                    animate={false}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="text-center text-xs text-muted-foreground relative z-10">
            <div className="font-medium mb-1">75hard-tracker.app</div>
            <div>#75Hard #75HardChallenge</div>
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
              {isSharing ? 'Generating...' : 'Download'}
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