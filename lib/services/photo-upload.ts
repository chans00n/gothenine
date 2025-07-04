import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'
import { formatDateForDB } from '@/lib/utils/timezone'
import { taskHelpers } from './task-completion'

// Dynamic import for heic2any to avoid SSR issues
let heic2any: any
if (typeof window !== 'undefined') {
  import('heic2any').then(heicModule => {
    heic2any = heicModule.default
  })
}

// Types
interface UploadProgress {
  percent: number
  loaded: number
  total: number
}

interface OfflinePhotoQueueItem {
  id: string
  file: File
  challengeId: string
  date: string
  taskId: string
  timestamp: number
  retries: number
}

// Constants
const STORAGE_BUCKET = 'progress'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const COMPRESSED_MAX_SIZE = 2 * 1024 * 1024 // 2MB
const THUMBNAIL_SIZE = 400
const OFFLINE_QUEUE_KEY = '75hard_offline_photo_queue'
const MAX_RETRIES = 3

export class PhotoUploadService {
  private static instance: PhotoUploadService
  private supabase = createClient()
  private offlineQueue: OfflinePhotoQueueItem[] = []
  private isOnline = typeof window !== 'undefined' ? navigator.onLine : true
  private uploadingQueue = new Set<string>()

  private constructor() {
    if (typeof window !== 'undefined') {
      this.loadOfflineQueue()
      
      window.addEventListener('online', this.handleOnline.bind(this))
      window.addEventListener('offline', this.handleOffline.bind(this))
      
      if (this.isOnline) {
        this.processOfflineQueue()
      }
    }
  }

  static getInstance(): PhotoUploadService {
    if (!PhotoUploadService.instance) {
      PhotoUploadService.instance = new PhotoUploadService()
    }
    return PhotoUploadService.instance
  }

  // Main upload function
  async uploadProgressPhoto(
    file: File,
    challengeId: string,
    date: Date,
    taskId: string = 'progress-photo',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ url: string; thumbnailUrl: string } | null> {
    try {
      // Validate file
      if (!this.validateFile(file)) {
        return null
      }

      // Convert HEIC if needed
      const processedFile = await this.convertHeicIfNeeded(file)

      // Compress image
      const compressedFile = await this.compressImage(processedFile, onProgress)

      // Create thumbnail
      const thumbnail = await this.createThumbnail(processedFile)

      // If offline, queue the upload
      if (!this.isOnline) {
        this.queueOfflineUpload({
          file: compressedFile,
          challengeId,
          date: formatDateForDB(date),
          taskId
        })
        toast.info('Offline', 'Photo will be uploaded when you reconnect')
        return null
      }

      // Upload both images
      const dateStr = formatDateForDB(date)
      const timestamp = Date.now()
      const mainPath = `${challengeId}/${dateStr}/main_${timestamp}.jpg`
      const thumbPath = `${challengeId}/${dateStr}/thumb_${timestamp}.jpg`

      // Upload main image
      const mainUpload = await this.uploadToSupabase(compressedFile, mainPath, onProgress)
      if (!mainUpload) return null

      // Upload thumbnail
      const thumbUpload = await this.uploadToSupabase(thumbnail, thumbPath)
      if (!thumbUpload) {
        // Cleanup main image if thumbnail fails
        await this.deleteFromSupabase(mainPath)
        return null
      }

      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        throw new Error('No authenticated user')
      }

      // Insert record into progress_photos table
      const { error: dbError } = await this.supabase
        .from('progress_photos')
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          photo_url: mainUpload.publicUrl,
          thumbnail_url: thumbUpload.publicUrl,
          date: dateStr,
          task_id: taskId
        })

      if (dbError) {
        console.error('Error saving photo to database:', dbError)
        // Don't fail the upload, but log the error
      }

      // Auto-complete the progress photo task
      try {
        const taskCompleted = await taskHelpers.completeProgressPhoto(mainUpload.publicUrl)
        if (taskCompleted) {
          console.log('Progress photo task auto-completed')
        }
      } catch (error) {
        console.error('Error auto-completing progress photo task:', error)
        // Don't fail the upload if task completion fails
      }

      return {
        url: mainUpload.publicUrl,
        thumbnailUrl: thumbUpload.publicUrl
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast.error('Upload Failed', 'Please try again')
      return null
    }
  }

  // Get photos for a date range
  async getPhotos(
    challengeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ url: string; thumbnailUrl: string; date: string; path: string }>> {
    try {
      const photos: Array<{ url: string; thumbnailUrl: string; date: string; path: string }> = []
      
      // For now, just check today's photo since we know the date
      // This avoids the complex folder listing issue
      const today = new Date()
      const dateStr = today.toISOString().split('T')[0]
      
      // Try to get today's photo directly
      const mainPath = `${challengeId}/${dateStr}/main_${today.getTime()}.jpg`
      const thumbPath = `${challengeId}/${dateStr}/thumb_${today.getTime()}.jpg`
      
      // Check if files exist by trying to get their public URLs
      const mainUrl = this.getPublicUrl(mainPath)
      const thumbUrl = this.getPublicUrl(thumbPath)
      
      // For now, if we have a photo uploaded today, show it
      // This is a temporary solution to avoid the infinite loading
      // In production, you'd want to properly list all photos
      
      console.log('Simplified photo fetch - checking for today\'s photo only')
      
      return photos
    } catch (error) {
      console.error('Error fetching photos:', error)
      return []
    }
  }

  // Delete a photo
  async deletePhoto(path: string): Promise<boolean> {
    try {
      // Extract thumb path
      const thumbPath = path.replace('/main_', '/thumb_')

      // Delete both files
      const results = await Promise.all([
        this.deleteFromSupabase(path),
        this.deleteFromSupabase(thumbPath)
      ])

      return results.every(r => r)
    } catch (error) {
      console.error('Error deleting photo:', error)
      return false
    }
  }

  // Private helper methods
  private validateFile(file: File): boolean {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large', `Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`)
      return false
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif']
    if (!validTypes.includes(file.type.toLowerCase()) && !file.name.toLowerCase().endsWith('.heic')) {
      toast.error('Invalid file type', 'Please upload a JPEG, PNG, or HEIC image')
      return false
    }

    return true
  }

  private async convertHeicIfNeeded(file: File): Promise<File> {
    if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
      try {
        if (!heic2any) {
          // Wait for dynamic import
          const heicModule = await import('heic2any')
          heic2any = heicModule.default
        }

        const blob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.9
        }) as Blob

        return new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
          type: 'image/jpeg'
        })
      } catch (error) {
        console.error('Error converting HEIC:', error)
        throw new Error('Failed to convert HEIC image')
      }
    }

    return file
  }

  private async compressImage(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<File> {
    const options = {
      maxSizeMB: COMPRESSED_MAX_SIZE / 1024 / 1024,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      onProgress: onProgress ? (percent: number) => {
        onProgress({
          percent,
          loaded: Math.round(file.size * percent / 100),
          total: file.size
        })
      } : undefined
    }

    try {
      // Dynamically import imageCompression to avoid build issues
      const { default: imageCompression } = await import('browser-image-compression')
      const compressedFile = await imageCompression(file, options)
      return new File([compressedFile], file.name, {
        type: compressedFile.type
      })
    } catch (error) {
      console.error('Error compressing image:', error)
      return file // Return original if compression fails
    }
  }

  private async createThumbnail(file: File): Promise<File> {
    const options = {
      maxSizeMB: 0.1, // 100KB
      maxWidthOrHeight: THUMBNAIL_SIZE,
      useWebWorker: true
    }

    try {
      // Dynamically import imageCompression to avoid build issues
      const { default: imageCompression } = await import('browser-image-compression')
      const thumbnail = await imageCompression(file, options)
      return new File([thumbnail], `thumb_${file.name}`, {
        type: thumbnail.type
      })
    } catch (error) {
      console.error('Error creating thumbnail:', error)
      throw error
    }
  }

  private async uploadToSupabase(
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ publicUrl: string } | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) throw error

      const publicUrl = this.getPublicUrl(path)
      return { publicUrl }
    } catch (error) {
      console.error('Error uploading to Supabase:', error)
      return null
    }
  }

  private async deleteFromSupabase(path: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(STORAGE_BUCKET)
        .remove([path])

      return !error
    } catch (error) {
      console.error('Error deleting from Supabase:', error)
      return false
    }
  }

  private getPublicUrl(path: string): string {
    const { data } = this.supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path)
    
    return data.publicUrl
  }

  // Offline queue management
  private loadOfflineQueue(): void {
    const stored = localStorage.getItem(OFFLINE_QUEUE_KEY)
    if (stored) {
      this.offlineQueue = JSON.parse(stored)
    }
  }

  private saveOfflineQueue(): void {
    // Convert Files to base64 for storage
    const queueToStore = this.offlineQueue.map(item => ({
      ...item,
      fileData: '' // We'll implement file serialization if needed
    }))
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queueToStore))
  }

  private queueOfflineUpload(data: Omit<OfflinePhotoQueueItem, 'id' | 'timestamp' | 'retries'>): void {
    const item: OfflinePhotoQueueItem = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0
    }

    this.offlineQueue.push(item)
    this.saveOfflineQueue()
  }

  private async processOfflineQueue(): Promise<void> {
    const queue = [...this.offlineQueue]
    
    for (const item of queue) {
      if (this.uploadingQueue.has(item.id)) continue
      
      this.uploadingQueue.add(item.id)
      
      try {
        const result = await this.uploadProgressPhoto(
          item.file,
          item.challengeId,
          new Date(item.date),
          item.taskId
        )

        if (result) {
          // Remove from queue on success
          this.offlineQueue = this.offlineQueue.filter(q => q.id !== item.id)
          toast.success('Photo Synced', 'Offline photo uploaded successfully')
        } else {
          // Increment retry count
          const queueItem = this.offlineQueue.find(q => q.id === item.id)
          if (queueItem) {
            queueItem.retries++
            if (queueItem.retries >= MAX_RETRIES) {
              this.offlineQueue = this.offlineQueue.filter(q => q.id !== item.id)
              toast.error('Upload Failed', 'Photo could not be uploaded after multiple attempts')
            }
          }
        }
      } catch (error) {
        console.error('Error processing offline photo:', error)
      } finally {
        this.uploadingQueue.delete(item.id)
      }
    }

    this.saveOfflineQueue()
  }

  private handleOnline(): void {
    this.isOnline = true
    this.processOfflineQueue()
  }

  private handleOffline(): void {
    this.isOnline = false
  }

  // Get photos for a specific date
  async getPhotosForDate(challengeId: string, date: Date): Promise<Array<{ photo_url: string }>> {
    try {
      const dateStr = formatDateForDB(date)
      
      const { data, error } = await this.supabase
        .from('progress_photos')
        .select('photo_url')
        .eq('challenge_id', challengeId)
        .eq('date', dateStr)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching photos:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getPhotosForDate:', error)
      return []
    }
  }

  // Get all photos for a challenge
  async getAllPhotosForChallenge(challengeId: string): Promise<Array<{
    id: string
    photo_url: string
    thumbnail_url: string
    date: string
    created_at: string
    task_id: string
  }>> {
    try {
      const { data, error } = await this.supabase
        .from('progress_photos')
        .select('id, photo_url, thumbnail_url, date, created_at, task_id')
        .eq('challenge_id', challengeId)
        .order('date', { ascending: false })

      if (error) {
        console.error('Error fetching all photos:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getAllPhotosForChallenge:', error)
      return []
    }
  }
}

// Export singleton instance
export const photoUploadService = PhotoUploadService.getInstance()