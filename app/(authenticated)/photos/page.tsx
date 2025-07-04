import { createClient } from '@/lib/supabase/server'
import { PhotosPageContent } from '@/components/photos/photos-page-content'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Camera, TrendingUp } from 'lucide-react'

// Loading skeleton component
function PhotosPageSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Hero Section Skeleton */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="container px-4 py-6 md:py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-64" />
              </div>
              
              <div className="flex gap-4 md:gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center">
                    <Skeleton className="h-8 w-12 mb-1" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="container px-4 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            
            {/* Today's Photo Section Skeleton */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square rounded-lg bg-muted animate-pulse" />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Skeleton */}
            <div className="space-y-6">
              
              {/* Progress Stats Skeleton */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-3 w-16 ml-auto" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-8" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-8" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tips Card Skeleton */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-20 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="w-2 h-2 rounded-full mt-2" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Gallery Card Skeleton */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Camera className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                    <Skeleton className="h-4 w-32 mx-auto mb-1" />
                    <Skeleton className="h-3 w-48 mx-auto" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

async function getPhotosData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch user's challenge data
  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  // If no active challenge, create one
  let challengeId = challenge?.id
  let startDate = challenge?.start_date ? new Date(challenge.start_date) : new Date()
  
  if (!challenge) {
    const { data: newChallenge } = await supabase
      .from('challenges')
      .insert({
        user_id: user.id,
        name: '75 Hard Challenge',
        start_date: startDate.toISOString(),
        is_active: true
      })
      .select()
      .single()
    
    challengeId = newChallenge?.id
  }

  // Get today's progress
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { data: todayProgress } = await supabase
    .from('daily_progress')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('date', today.toISOString().split('T')[0])
    .single()

  const todayPhotoUrl = todayProgress?.tasks?.['progress-photo']?.photoUrl

  // Get all photos for the challenge
  const { data: allPhotos } = await supabase
    .from('progress_photos')
    .select('id, photo_url, thumbnail_url, date, created_at, task_id')
    .eq('challenge_id', challengeId)
    .order('date', { ascending: false })

  return {
    challengeId,
    startDate,
    todayPhotoUrl,
    allPhotos: allPhotos || []
  }
}

async function PhotosPageServer() {
  const data = await getPhotosData()

  if (!data) {
    redirect('/auth/login')
  }

  const { challengeId, startDate, todayPhotoUrl, allPhotos } = data

  return (
    <PhotosPageContent
      challengeId={challengeId}
      startDate={startDate}
      todayPhotoUrl={todayPhotoUrl}
      allPhotos={allPhotos}
    />
  )
}

export default function PhotosPage() {
  return (
    <Suspense fallback={<PhotosPageSkeleton />}>
      <PhotosPageServer />
    </Suspense>
  )
}