"use client"

import { useState, useEffect } from 'react'
import { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Image as ImageIcon, Download, ZoomIn } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

interface Photo {
  id: string
  photo_url: string
  thumbnail_url: string
  date: string
  task_id: string
  created_at: string
}

interface HistoricalPhotoGalleryProps {
  challengeId: string
  dateRange: DateRange
}

export function HistoricalPhotoGallery({ challengeId, dateRange }: HistoricalPhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [filterTask, setFilterTask] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid')
  
  const supabase = createClient()

  useEffect(() => {
    async function loadPhotos() {
      if (!dateRange.from || !dateRange.to) return

      setLoading(true)
      try {
        let query = supabase
          .from('progress_photos')
          .select('*')
          .eq('challenge_id', challengeId)
          .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
          .lte('date', format(dateRange.to, 'yyyy-MM-dd'))
          .order('date', { ascending: false })

        if (filterTask !== 'all') {
          query = query.eq('task_id', filterTask)
        }

        const { data, error } = await query

        if (error) throw error

        setPhotos(data || [])
      } catch (error) {
        console.error('Error loading photos:', error)
        toast.error('Failed to load photos')
      } finally {
        setLoading(false)
      }
    }

    loadPhotos()
  }, [challengeId, dateRange, filterTask, supabase])

  const handleDownload = async (photo: Photo) => {
    try {
      const response = await fetch(photo.photo_url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `75hard-${photo.date}-${photo.task_id}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Photo downloaded')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download photo')
    }
  }

  const groupPhotosByDate = () => {
    const grouped: Record<string, Photo[]> = {}
    photos.forEach(photo => {
      if (!grouped[photo.date]) {
        grouped[photo.date] = []
      }
      grouped[photo.date].push(photo)
    })
    return grouped
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Photo Gallery</CardTitle>
          <CardDescription>Loading your progress photos...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Photo Gallery</CardTitle>
              <CardDescription>
                {photos.length} photos from {format(dateRange.from!, 'MMM d')} to {format(dateRange.to!, 'MMM d, yyyy')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filterTask} onValueChange={setFilterTask}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Photos</SelectItem>
                  <SelectItem value="progress-photo">Progress Photos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid View</SelectItem>
                  <SelectItem value="timeline">Timeline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No photos found for this date range</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group cursor-pointer overflow-hidden rounded-lg"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.thumbnail_url || photo.photo_url}
                    alt={`Progress photo from ${photo.date}`}
                    className="w-full h-full aspect-square object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" className="h-8 w-8" aria-label="View photo">
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-white text-xs font-medium">
                      {format(new Date(photo.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupPhotosByDate())
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([date, datePhotos]) => (
                  <div key={date} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {datePhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="relative group cursor-pointer overflow-hidden rounded-lg"
                          onClick={() => setSelectedPhoto(photo)}
                        >
                          <img
                            src={photo.thumbnail_url || photo.photo_url}
                            alt={`Progress photo from ${photo.date}`}
                            className="w-full h-full aspect-square object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Viewer Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          {selectedPhoto && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={selectedPhoto.photo_url}
                  alt={`Progress photo from ${selectedPhoto.date}`}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {format(new Date(selectedPhoto.date), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Uploaded {format(new Date(selectedPhoto.created_at), 'h:mm a')}
                  </p>
                </div>
                <Button onClick={() => handleDownload(selectedPhoto)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}