import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'

export interface SyncQueueItem {
  id: string
  type: 'daily_progress' | 'water_intake' | 'workout_history' | 'walk_history' | 'daily_notes'
  action: 'create' | 'update' | 'delete'
  table: string
  data: any
  timestamp: number
  retries: number
  error?: string
  conflictResolution?: 'keep_local' | 'keep_remote' | 'merge'
}

interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  pendingItems: number
  lastSyncTime?: Date
  errors: number
}

type SyncStatusListener = (status: SyncStatus) => void

export class SyncService {
  private static instance: SyncService
  private supabase = createClient()
  private syncQueue: SyncQueueItem[] = []
  private isOnline = typeof window !== 'undefined' ? navigator.onLine : true
  private isSyncing = false
  private syncInterval: NodeJS.Timeout | null = null
  private statusListeners: Set<SyncStatusListener> = new Set()
  private readonly MAX_RETRIES = 3
  private readonly SYNC_INTERVAL = 30000 // 30 seconds
  private readonly QUEUE_KEY = '75hard_sync_queue'
  
  private constructor() {
    if (typeof window !== 'undefined') {
      this.loadQueue()
      this.setupEventListeners()
      this.startSyncInterval()
      this.registerServiceWorker()
      
      // Try initial sync if online
      if (this.isOnline) {
        this.processSyncQueue()
      }
    }
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService()
    }
    return SyncService.instance
  }

  // Add item to sync queue
  addToQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): void {
    const queueItem: SyncQueueItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0
    }

    this.syncQueue.push(queueItem)
    this.saveQueue()
    this.notifyStatusChange()

    // Try to sync immediately if online
    if (this.isOnline && !this.isSyncing) {
      this.processSyncQueue()
    }
  }

  // Process sync queue
  async processSyncQueue(): Promise<void> {
    if (this.isSyncing || !this.isOnline || this.syncQueue.length === 0) {
      return
    }

    this.isSyncing = true
    this.notifyStatusChange()

    const itemsToProcess = [...this.syncQueue]
    const processedIds: string[] = []
    const failedItems: SyncQueueItem[] = []

    for (const item of itemsToProcess) {
      try {
        await this.processQueueItem(item)
        processedIds.push(item.id)
      } catch (error) {
        console.error('Error processing sync item:', error)
        item.retries++
        item.error = error instanceof Error ? error.message : 'Unknown error'
        
        if (item.retries < this.MAX_RETRIES) {
          failedItems.push(item)
        } else {
          // Max retries reached, notify user
          this.notifyMaxRetriesReached(item)
          processedIds.push(item.id) // Remove from queue
        }
      }
    }

    // Update queue
    this.syncQueue = [
      ...failedItems,
      ...this.syncQueue.filter(item => !processedIds.includes(item.id))
    ]
    
    this.saveQueue()
    this.isSyncing = false
    this.notifyStatusChange()

    // Show sync complete notification if items were processed
    if (processedIds.length > 0) {
      toast.success('Sync Complete', `${processedIds.length} items synced`)
    }
  }

  // Process individual queue item
  private async processQueueItem(item: SyncQueueItem): Promise<void> {
    const { table, action, data } = item

    switch (action) {
      case 'create':
        // For creates, check if the record already exists (conflict resolution)
        if (data.id) {
          const { data: existing } = await this.supabase
            .from(table)
            .select('id')
            .eq('id', data.id)
            .single()
          
          if (existing) {
            // Record exists, convert to update
            const { error: updateError } = await this.supabase
              .from(table)
              .update(data)
              .eq('id', data.id)
            if (updateError) throw updateError
            return
          }
        }
        
        const { error: createError } = await this.supabase
          .from(table)
          .insert(data)
        if (createError) {
          // Handle unique constraint violations
          if (createError.code === '23505') {
            // Try update instead
            const { error: updateError } = await this.supabase
              .from(table)
              .update(data)
              .eq('id', data.id)
            if (updateError) throw updateError
          } else {
            throw createError
          }
        }
        break

      case 'update':
        // For updates, use upsert to handle cases where record might not exist
        const { error: updateError } = await this.supabase
          .from(table)
          .upsert(data, { onConflict: 'id' })
        if (updateError) throw updateError
        break

      case 'delete':
        const { error: deleteError } = await this.supabase
          .from(table)
          .delete()
          .eq('id', data.id)
        // Ignore not found errors for deletes
        if (deleteError && deleteError.code !== 'PGRST116') {
          throw deleteError
        }
        break
    }
  }

  // Subscribe to status changes
  subscribeToStatus(listener: SyncStatusListener): () => void {
    this.statusListeners.add(listener)
    // Send current status immediately
    listener(this.getStatus())
    
    // Return unsubscribe function
    return () => {
      this.statusListeners.delete(listener)
    }
  }

  // Get current sync status
  getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingItems: this.syncQueue.length,
      lastSyncTime: this.getLastSyncTime(),
      errors: this.syncQueue.filter(item => item.retries > 0).length
    }
  }

  // Clear sync queue (use with caution)
  clearQueue(): void {
    this.syncQueue = []
    this.saveQueue()
    this.notifyStatusChange()
    toast.info('Sync queue cleared')
  }

  // Retry failed items
  retryFailed(): void {
    this.syncQueue.forEach(item => {
      if (item.retries > 0) {
        item.retries = 0
        item.error = undefined
      }
    })
    this.saveQueue()
    this.processSyncQueue()
  }

  // Private methods
  private setupEventListeners(): void {
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
    
    // Listen for storage changes (sync across tabs)
    window.addEventListener('storage', (e) => {
      if (e.key === this.QUEUE_KEY) {
        this.loadQueue()
        this.notifyStatusChange()
      }
    })

    // Visibility change listener
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.processSyncQueue()
      }
    })
    
    // Listen for messages from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_COMPLETE') {
          this.loadQueue()
          this.notifyStatusChange()
        }
      })
    }
  }
  
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        
        // Register for background sync
        if ('sync' in registration) {
          await registration.sync.register('75hard-sync')
        }
        
        // Register for periodic sync if available
        if ('periodicSync' in registration && navigator.permissions) {
          const status = await navigator.permissions.query({
            name: 'periodic-background-sync' as PermissionName,
          })
          
          if (status.state === 'granted') {
            await (registration as any).periodicSync.register('75hard-periodic-sync', {
              minInterval: 12 * 60 * 60 * 1000, // 12 hours
            })
          }
        }
      } catch (error) {
        console.error('Failed to register service worker sync:', error)
      }
    }
  }

  private startSyncInterval(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing && this.syncQueue.length > 0) {
        this.processSyncQueue()
      }
    }, this.SYNC_INTERVAL)
  }

  private handleOnline(): void {
    this.isOnline = true
    this.notifyStatusChange()
    toast.info('Back online', 'Syncing pending changes...')
    this.processSyncQueue()
  }

  private handleOffline(): void {
    this.isOnline = false
    this.notifyStatusChange()
    toast.warning('Offline', 'Changes will sync when connection returns')
  }

  private loadQueue(): void {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(this.QUEUE_KEY)
    if (stored) {
      try {
        this.syncQueue = JSON.parse(stored)
      } catch (error) {
        console.error('Error loading sync queue:', error)
        this.syncQueue = []
      }
    }
  }

  private saveQueue(): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.syncQueue))
    localStorage.setItem('75hard_last_sync', new Date().toISOString())
  }

  private getLastSyncTime(): Date | undefined {
    if (typeof window === 'undefined') return undefined
    const lastSync = localStorage.getItem('75hard_last_sync')
    return lastSync ? new Date(lastSync) : undefined
  }

  private notifyStatusChange(): void {
    const status = this.getStatus()
    this.statusListeners.forEach(listener => listener(status))
  }

  private notifyMaxRetriesReached(item: SyncQueueItem): void {
    toast.error(
      'Sync Failed',
      `Failed to sync ${item.type} after ${this.MAX_RETRIES} attempts. Data has been removed from queue.`
    )
  }

  // Cleanup
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    this.statusListeners.clear()
  }
}

// Export singleton instance
export const syncService = SyncService.getInstance()

// Helper function to integrate with existing services
export function queueOfflineAction(
  type: SyncQueueItem['type'],
  action: SyncQueueItem['action'],
  table: string,
  data: any
): void {
  syncService.addToQueue({
    type,
    action,
    table,
    data
  })
}