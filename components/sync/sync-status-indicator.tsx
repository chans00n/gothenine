'use client'

import { useSyncStatus } from '@/hooks/use-sync-status'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import {
  Cloud,
  CloudOff,
  RefreshCw,
  AlertCircle,
  Check,
  Loader2,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export function SyncStatusIndicator() {
  const {
    isOnline,
    isSyncing,
    pendingItems,
    lastSyncTime,
    errors,
    retry,
    clearQueue
  } = useSyncStatus()

  const getIcon = () => {
    if (!isOnline) return <CloudOff className="h-4 w-4" />
    if (isSyncing) return <Loader2 className="h-4 w-4 animate-spin" />
    if (errors > 0) return <AlertCircle className="h-4 w-4" />
    if (pendingItems > 0) return <RefreshCw className="h-4 w-4" />
    return <Cloud className="h-4 w-4" />
  }

  const getColor = () => {
    if (!isOnline) return 'text-muted-foreground'
    if (errors > 0) return 'text-red-500'
    if (pendingItems > 0) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getStatus = () => {
    if (!isOnline) return 'Offline'
    if (isSyncing) return 'Syncing...'
    if (errors > 0) return `${errors} errors`
    if (pendingItems > 0) return `${pendingItems} pending`
    return 'Synced'
  }

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never'
    
    const now = new Date()
    const diff = now.getTime() - lastSyncTime.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes === 1) return '1 minute ago'
    if (minutes < 60) return `${minutes} minutes ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours === 1) return '1 hour ago'
    if (hours < 24) return `${hours} hours ago`
    
    return lastSyncTime.toLocaleDateString()
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2 h-8 px-2",
            getColor()
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={getStatus()}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              {getIcon()}
            </motion.div>
          </AnimatePresence>
          <span className="text-xs hidden sm:inline">{getStatus()}</span>
          {pendingItems > 0 && (
            <Badge variant="secondary" className="h-5 px-1 text-xs">
              {pendingItems}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Sync Status</h4>
            <div className={cn("flex items-center gap-1", getColor())}>
              {getIcon()}
              <span className="text-sm">{getStatus()}</span>
            </div>
          </div>

          {/* Status Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connection</span>
              <span className={cn(
                "flex items-center gap-1",
                isOnline ? "text-green-600" : "text-muted-foreground"
              )}>
                {isOnline ? (
                  <>
                    <Check className="h-3 w-3" />
                    Online
                  </>
                ) : (
                  <>
                    <CloudOff className="h-3 w-3" />
                    Offline
                  </>
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Last sync</span>
              <span>{formatLastSync()}</span>
            </div>

            {pendingItems > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending items</span>
                <span className="text-yellow-600">{pendingItems}</span>
              </div>
            )}

            {errors > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Failed items</span>
                <span className="text-red-600">{errors}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {(pendingItems > 0 || errors > 0) && (
            <>
              <div className="h-px bg-border" />
              <div className="flex gap-2">
                {errors > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={retry}
                    className="flex-1"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    Retry Failed
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearQueue}
                  className="text-destructive hover:text-destructive"
                  aria-label="Clear sync queue"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}

          {/* Offline Message */}
          {!isOnline && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              Your changes are being saved locally and will sync when you're back online.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}