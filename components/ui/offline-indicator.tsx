"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { WifiOff, Wifi, Cloud, CloudOff } from "lucide-react"
import { cn } from "@/lib/utils"

// Hook to detect online/offline status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? window.navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isOnline
}

// Offline banner component
export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true)
    } else {
      // Keep banner visible for 2 seconds after coming back online
      const timer = setTimeout(() => setShowBanner(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isOnline])

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "fixed top-0 left-0 right-0 z-50",
            "px-4 py-2",
            isOnline ? "bg-green-500" : "bg-orange-500"
          )}
        >
          <div className="container flex items-center justify-center gap-2 text-white">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4" />
                <span className="text-sm font-medium">Back online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" />
                <span className="text-sm font-medium">
                  No internet connection. Some features may be limited.
                </span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Offline indicator badge
export function OfflineIndicator({ className }: { className?: string }) {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <WifiOff className="h-5 w-5 text-orange-500" />
        <motion.div
          className="absolute inset-0"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <WifiOff className="h-5 w-5 text-orange-500" />
        </motion.div>
      </div>
      <span className="text-sm text-muted-foreground">Offline</span>
    </div>
  )
}

// Sync status indicator
export function SyncIndicator({ 
  status = "idle",
  className 
}: { 
  status?: "idle" | "syncing" | "synced" | "error"
  className?: string 
}) {
  const isOnline = useOnlineStatus()

  const getIcon = () => {
    if (!isOnline) return <CloudOff className="h-4 w-4 text-muted-foreground" />
    
    switch (status) {
      case "syncing":
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Cloud className="h-4 w-4 text-blue-500" />
          </motion.div>
        )
      case "synced":
        return <Cloud className="h-4 w-4 text-green-500" />
      case "error":
        return <CloudOff className="h-4 w-4 text-red-500" />
      default:
        return <Cloud className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getLabel = () => {
    if (!isOnline) return "Offline"
    
    switch (status) {
      case "syncing":
        return "Syncing..."
      case "synced":
        return "Synced"
      case "error":
        return "Sync error"
      default:
        return "Not synced"
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {getIcon()}
      <span className="text-xs text-muted-foreground">{getLabel()}</span>
    </div>
  )
}

// Offline card component
export function OfflineCard({ children }: { children: React.ReactNode }) {
  const isOnline = useOnlineStatus()

  return (
    <div className="relative">
      {children}
      {!isOnline && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <div className="text-center p-4">
            <WifiOff className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">Offline Mode</p>
            <p className="text-xs text-muted-foreground mt-1">
              This content requires an internet connection
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Connection status hook with more details
export function useConnectionStatus() {
  const [status, setStatus] = useState({
    online: typeof window !== "undefined" ? window.navigator.onLine : true,
    effectiveType: "4g",
    downlink: 10,
    rtt: 50,
    saveData: false
  })

  useEffect(() => {
    const updateConnectionStatus = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection

      setStatus({
        online: window.navigator.onLine,
        effectiveType: connection?.effectiveType || "4g",
        downlink: connection?.downlink || 10,
        rtt: connection?.rtt || 50,
        saveData: connection?.saveData || false
      })
    }

    updateConnectionStatus()

    window.addEventListener("online", updateConnectionStatus)
    window.addEventListener("offline", updateConnectionStatus)

    const connection = (navigator as any).connection
    if (connection) {
      connection.addEventListener("change", updateConnectionStatus)
    }

    return () => {
      window.removeEventListener("online", updateConnectionStatus)
      window.removeEventListener("offline", updateConnectionStatus)
      if (connection) {
        connection.removeEventListener("change", updateConnectionStatus)
      }
    }
  }, [])

  return status
}