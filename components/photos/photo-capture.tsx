"use client"

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import { photoUploadService } from '@/lib/services/photo-upload'
import { toast } from '@/lib/toast'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface PhotoCaptureProps {
  challengeId: string
  date: Date
  taskId?: string
  onPhotoUploaded?: (url: string, thumbnailUrl: string) => void
  currentPhotoUrl?: string
  className?: string
}

export function PhotoCapture({
  challengeId,
  date,
  taskId = 'progress_photo',
  onPhotoUploaded,
  currentPhotoUrl,
  className
}: PhotoCaptureProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null)
  const [showCapture, setShowCapture] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (file: File | null) => {
    if (!file) return

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const result = await photoUploadService.uploadProgressPhoto(
        file,
        challengeId,
        date,
        taskId,
        (progress) => {
          setUploadProgress(Math.round(progress.percent))
        }
      )

      if (result) {
        toast.success('Photo Uploaded', 'Your progress photo has been saved')
        onPhotoUploaded?.(result.url, result.thumbnailUrl)
        setShowCapture(false)
      } else {
        // Reset preview if upload failed
        setPreview(currentPhotoUrl || null)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload Failed', 'Please try again')
      setPreview(currentPhotoUrl || null)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [challengeId, date, taskId, onPhotoUploaded, currentPhotoUrl])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleCameraCapture = () => {
    // On mobile, this will open the camera
    fileInputRef.current?.click()
  }

  const handleRemovePhoto = () => {
    setPreview(null)
    setShowCapture(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!showCapture && preview) {
    return (
      <Card className={cn("overflow-hidden p-0", className)}>
        <div className="relative aspect-square">
          <Image
            src={preview}
            alt="Progress photo"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-end">
            <div className="text-white">
              <p className="text-sm font-medium">Progress Photo</p>
              <p className="text-xs opacity-80">
                {date.toLocaleDateString()}
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowCapture(true)}
              disabled={isUploading}
            >
              Change
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn("overflow-hidden p-0", className)}>
      <CardContent className="p-0">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInputChange}
          className="hidden"
          aria-label="Upload progress photo"
          id="photo-upload-input"
        />

        {preview ? (
          <div className="space-y-0">
            <div className="relative aspect-square overflow-hidden bg-muted">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
              />
              {!isUploading && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={handleRemovePhoto}
                  aria-label="Remove photo"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {isUploading && (
              <div className="space-y-2 p-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 p-6">
            <div className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 flex flex-col items-center justify-center p-8">
              <Camera className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground text-center mb-4">
                Take or upload your daily progress photo
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleCameraCapture}
                  disabled={isUploading}
                  variant="default"
                  size="sm"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4 mr-2" />
                  )}
                  Take Photo
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  variant="outline"
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Photos are automatically compressed and stored securely
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}