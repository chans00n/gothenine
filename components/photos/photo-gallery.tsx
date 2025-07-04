"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel'
import { Calendar, Camera, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useEffect } from 'react'

interface Photo {
  id: string
  photo_url: string
  thumbnail_url: string
  date: string
  created_at: string
  task_id: string
}

interface PhotoGalleryProps {
  photos: Photo[]
  startDate?: Date
  isLoading?: boolean
}

export function PhotoGallery({ photos, startDate, isLoading = false }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!api) {
      return
    }

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDayNumber = (dateStr: string) => {
    if (!startDate) return 1
    
    const date = new Date(dateStr)
    const start = new Date(startDate)
    const diffTime = date.getTime() - start.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays + 1
  }

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo)
  }

  if (isLoading) {
    return (
      <div className="w-full h-[500px] bg-muted rounded-lg animate-pulse flex items-center justify-center">
        <Camera className="h-12 w-12 text-muted-foreground/50" />
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-16">
        <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-muted-foreground mb-1">No photos yet</p>
        <p className="text-sm text-muted-foreground">
          Start taking your daily progress photos to see them here
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="w-full max-w-4xl mx-auto">
        <Carousel setApi={setApi} className="w-full">
          <CarouselContent>
            {photos.map((photo) => (
              <CarouselItem key={photo.id}>
                                <div className="p-0">
                  <Card 
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 group p-0"
                    onClick={() => handlePhotoClick(photo)}
                  >
                    <CardContent className="p-0 m-0">
                       <div className="relative h-[400px] md:h-[500px] bg-muted">
                         <Image
                           src={photo.photo_url}
                           alt={`Progress photo from ${formatDate(photo.date)}`}
                           fill
                           className="object-cover transition-transform duration-200 group-hover:scale-105"
                           sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                         />
                        
                        {/* Zoom overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                              <ZoomIn className="h-6 w-6 text-gray-700" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Navigation buttons */}
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </Carousel>
        
        {/* Day number and date below carousel */}
        <div className="text-center mt-6 space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Badge variant="outline" className="text-base px-4 py-2">
              Day {getDayNumber(photos[current - 1]?.date || photos[0]?.date)}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {formatDate(photos[current - 1]?.date || photos[0]?.date)}
            </Badge>
          </div>
          
          {/* Slide indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-sm text-muted-foreground">
              {current} of {count}
            </span>
                         <div className="flex gap-1">
               {photos.map((_, index) => (
                 <button
                   key={index}
                   onClick={() => api?.scrollTo(index)}
                   className={`w-2 h-2 rounded-full transition-colors ${
                     index === current - 1 ? 'bg-primary' : 'bg-muted-foreground/30'
                   }`}
                   aria-label={`Go to photo ${index + 1}`}
                   title={`Go to photo ${index + 1}`}
                 />
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* Photo Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Progress Photo - {selectedPhoto && formatDate(selectedPhoto.date)}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPhoto && (
            <div className="relative">
              {/* Main photo */}
              <div className="relative aspect-square max-h-[70vh] overflow-hidden rounded-lg bg-muted">
                <Image
                  src={selectedPhoto.photo_url}
                  alt={`Progress photo from ${formatDate(selectedPhoto.date)}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>

              {/* Photo details */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{formatDate(selectedPhoto.date)}</p>
                    <p className="text-sm text-muted-foreground">
                      Day {getDayNumber(selectedPhoto.date)} of 75
                    </p>
                  </div>
                  <Badge variant="outline">
                    Progress Photo
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}