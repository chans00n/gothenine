"use client"

import { ReactNode } from "react"
import { Header } from "@/components/navigation/header"
import { BottomNav } from "@/components/navigation/bottom-nav"
import { cn } from "@/lib/utils"

interface AppLayoutProps {
  children: ReactNode
  title?: string
  showHeader?: boolean
  showBottomNav?: boolean
  className?: string
}

export function AppLayout({
  children,
  title,
  showHeader = true,
  showBottomNav = true,
  className
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {showHeader && <Header title={title} />}
      
      <main className={cn(
        "flex-1",
        showBottomNav && "pb-20 md:pb-0",
        className
      )}>
        {children}
      </main>
      
      {showBottomNav && <BottomNav />}
    </div>
  )
}

// Layout with floating navigation
export function FloatingLayout({
  children,
  title,
  className
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header title={title} />
      
      <main className={cn(
        "flex-1 pb-24 md:pb-0",
        className
      )}>
        {children}
      </main>
      
      <FloatingBottomNav />
    </div>
  )
}

import { FloatingBottomNav } from "@/components/navigation/bottom-nav"