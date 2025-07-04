'use client'

import { useState, useEffect } from 'react'
import { syncService } from '@/lib/services/sync-service'

interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  pendingItems: number
  lastSyncTime?: Date
  errors: number
}

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    pendingItems: 0,
    lastSyncTime: undefined,
    errors: 0
  })

  useEffect(() => {
    // Get initial status and subscribe to changes
    setStatus(syncService.getStatus())
    const unsubscribe = syncService.subscribeToStatus(setStatus)
    
    return unsubscribe
  }, [])

  const retry = () => {
    syncService.retryFailed()
  }

  const clearQueue = () => {
    if (confirm('Are you sure you want to clear all pending sync items? This cannot be undone.')) {
      syncService.clearQueue()
    }
  }

  return {
    ...status,
    retry,
    clearQueue
  }
}