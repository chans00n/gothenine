"use client"

import { MobileMenu } from "./mobile-menu"
import { SyncStatusIndicator } from "@/components/sync/sync-status-indicator"
import { NotificationBell } from "./notification-bell"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface HeaderProps {
  title?: string
  showNotifications?: boolean
  className?: string
}

export function Header({ 
  title = "75 Hard Tracker", 
  showNotifications = true,
  className 
}: HeaderProps) {
  return (
    <header className={cn(
      "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="container flex h-16 items-center px-4">
        <MobileMenu />
        
        <div className="flex-1 px-4">
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <SyncStatusIndicator />
          
          {showNotifications && <NotificationBell />}
        </div>
      </div>
    </header>
  )
}

// Desktop navigation for larger screens
export function DesktopNav() {
  return (
    <nav className="hidden md:flex items-center gap-6">
      <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
        Dashboard
      </Link>
      <Link href="/checklist" className="text-sm font-medium transition-colors hover:text-primary">
        Daily Tasks
      </Link>
      <Link href="/calendar" className="text-sm font-medium transition-colors hover:text-primary">
        Calendar
      </Link>
      <Link href="/community" className="text-sm font-medium transition-colors hover:text-primary">
        Community
      </Link>
      <Link href="/progress" className="text-sm font-medium transition-colors hover:text-primary">
        Progress
      </Link>
    </nav>
  )
}