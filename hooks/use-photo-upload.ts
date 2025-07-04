'use client'

import { useState, useCallback } from 'react'
import { photoUploadService } from '@/lib/services/photo-upload'
import { dailyProgressService } from '@/lib/services/daily-progress'
import { toast } from '@/lib/toast'

interface UsePhotoUploadOptions {
  challengeId: string
  date: Date
  taskId?: string
  onUploadComplete?: (url: string, thumbnailUrl: string) => void
}

export function usePhotoUpload({
  challengeId,
  date,
  taskId = 'progress_photo',
  onUploadComplete
}: UsePhotoUploadOptions) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const uploadPhoto = useCallback(async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const result = await photoUploadService.uploadProgressPhoto(
        file,
        challengeId,
        date,
        taskId,
        (progress) => setUploadProgress(progress.percent)
      )

      if (result) {
        // Update the daily progress with the photo URL
        await dailyProgressService.updateTaskProgress(
          challengeId,
          date,
          taskId,
          {
            photoUrl: result.url,
            completed: true,
            completedAt: new Date().toISOString()
          }
        )

        toast.success('Photo uploaded successfully!')
        onUploadComplete?.(result.url, result.thumbnailUrl)
        return result
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Photo upload error:', error)
      toast.error('Failed to upload photo')
      return null
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [challengeId, date, taskId, onUploadComplete])

  return {
    uploadPhoto,
    isUploading,
    uploadProgress
  }
}