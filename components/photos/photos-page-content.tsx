"use client"

import { PhotoCapture } from '@/components/photos/photo-capture'
import { PhotoGallery } from '@/components/photos/photo-gallery'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Camera, Calendar, TrendingUp, Target, Award, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface Photo {
  id: string
  photo_url: string
  thumbnail_url: string
  date: string
  created_at: string
  task_id: string
}

interface PhotosPageContentProps {
  challengeId: string
  startDate: Date
  todayPhotoUrl?: string
  allPhotos: Photo[]
}

interface PhotoStats {
  totalDays: number
  completedDays: number
  currentStreak: number
  longestStreak: number
  completionRate: number
}

export function PhotosPageContent({ challengeId, startDate, todayPhotoUrl, allPhotos }: PhotosPageContentProps) {
  const router = useRouter()
  const [stats, setStats] = useState<PhotoStats>({
    totalDays: 0,
    completedDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    completionRate: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  const handlePhotoUploaded = () => {
    // Refresh the page to update the gallery and stats
    router.refresh()
  }

  // Calculate current day number
  const currentDay = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const totalDays = Math.min(currentDay, 75)
  const progressPercentage = (totalDays / 75) * 100
  
  // Calculate real stats based on photos
  const completedDays = allPhotos.length
  const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0
  
  // Calculate current streak (photos taken on consecutive days from today backwards)
  const getCurrentStreak = () => {
    if (allPhotos.length === 0) return 0
    
    const today = new Date()
    let streak = 0
    let checkDate = new Date(today)
    
    // Sort photos by date descending
    const sortedPhotos = [...allPhotos].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    for (let i = 0; i < totalDays; i++) {
      const checkDateStr = checkDate.toISOString().split('T')[0]
      const hasPhotoForDate = sortedPhotos.some(photo => photo.date === checkDateStr)
      
      if (hasPhotoForDate) {
        streak++
      } else {
        break
      }
      
      checkDate.setDate(checkDate.getDate() - 1)
    }
    
    return streak
  }
  
  const photoStats = {
    totalDays: totalDays,
    completedDays: completedDays,
    currentStreak: getCurrentStreak(),
    longestStreak: completedDays, // Simplified for now
    completionRate: Math.round(completionRate)
  }

  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  const hasCompletedToday = !!todayPhotoUrl

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="container px-4 py-6 md:py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary">
                    <Camera className="h-4 w-4" />
                    <span className="text-sm font-medium">Day {totalDays}</span>
                  </div>
                  {hasCompletedToday && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Today Complete
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold">Progress Photos</h1>
                <p className="text-muted-foreground">
                  {formattedDate} • Document your transformation journey
                </p>
              </div>
              
              <div className="flex gap-4 md:gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{photoStats.completedDays}</p>
                  <p className="text-xs text-muted-foreground">Photos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{photoStats.currentStreak}</p>
                  <p className="text-xs text-muted-foreground">Streak</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{photoStats.completionRate}%</p>
                  <p className="text-xs text-muted-foreground">Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            
            {/* Today's Photo Section */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        Today's Photo
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {formattedDate}
                      </CardDescription>
                    </div>
                    {hasCompletedToday && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <PhotoCapture
                    challengeId={challengeId}
                    date={new Date()}
                    currentPhotoUrl={todayPhotoUrl}
                    onPhotoUploaded={handlePhotoUploaded}
                    className="w-full"
                  />
                  
                  {!hasCompletedToday && (
                    <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-start gap-3">
                        <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900">Ready to capture today's progress?</p>
                          <p className="text-sm text-blue-700 mt-1">
                            Take your daily photo to track your transformation and automatically complete your task.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tips and Gallery Sidebar */}
            <div className="space-y-6">

              {/* Photo Tips */}
              <Card>
                <CardHeader>
                  <CardTitle>Photo Tips</CardTitle>
                  <CardDescription>
                    Get the best results from your progress photos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium">Consistent Timing</p>
                      <p className="text-xs text-muted-foreground">Take photos at the same time each day</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium">Same Location</p>
                      <p className="text-xs text-muted-foreground">Use the same background and lighting</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium">Similar Clothing</p>
                      <p className="text-xs text-muted-foreground">Wear the same outfit for better comparison</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium">Multiple Angles</p>
                      <p className="text-xs text-muted-foreground">Consider front, side, and back photos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Photo Gallery */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Photo Gallery</span>
                    <Badge variant="secondary" className="text-xs">
                      {allPhotos.length} photo{allPhotos.length !== 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Your transformation timeline
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PhotoGallery photos={allPhotos} startDate={startDate} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}