import { MinimalNav, MinimalDesktopNav } from '@/components/layouts/minimal-nav'
import { OfflineBanner } from '@/components/ui/offline-indicator'
import { SyncStatusIndicator } from '@/components/sync/sync-status-indicator'
import { NotificationBell } from '@/components/navigation/notification-bell'

export default function MinimalAuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <MinimalDesktopNav />
      
      {/* Main content with padding for desktop nav */}
      <div className="md:pl-16">
        {/* Minimal header bar */}
        <header className="fixed top-0 right-0 left-0 md:left-16 z-40 bg-background/80 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-2">
              <SyncStatusIndicator />
            </div>
            <NotificationBell />
          </div>
        </header>
        
        {/* Content area with padding for fixed header */}
        <main className="pt-14 pb-16 md:pb-0">
          <OfflineBanner />
          {children}
        </main>
      </div>
      
      {/* Mobile bottom nav */}
      <MinimalNav />
    </div>
  )
}