"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  Menu,
  X,
  Settings,
  Bell,
  HelpCircle,
  BookOpen,
  Award,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Smartphone,
  Timer,
  Footprints,
  Droplets,
  FileText,
  LucideIcon
} from "lucide-react"
import { useTheme } from "next-themes"
import { inAppNotificationService } from "@/lib/services/in-app-notification-service"

interface MenuItem {
  href?: string
  label: string
  icon: LucideIcon
  action?: () => void
  badge?: string
  description?: string
}

const menuSections: { title: string; items: MenuItem[] }[] = [
  {
    title: "Tools",
    items: [
      {
        href: "/timer",
        label: "Workout Timer",
        icon: Timer,
        description: "Track your workouts"
      },
      {
        href: "/walk",
        label: "Walk Tracker",
        icon: Footprints,
        description: "Track outdoor walks"
      },
      {
        href: "/water",
        label: "Water Intake",
        icon: Droplets,
        description: "Monitor hydration"
      },
      {
        href: "/notes",
        label: "Daily Notes",
        icon: FileText,
        description: "Journal your journey"
      },
    ]
  },
  {
    title: "Account",
    items: [
      {
        href: "/settings",
        label: "Settings",
        icon: Settings,
        description: "Manage your account"
      },
      {
        href: "/notifications",
        label: "Notifications",
        icon: Bell,
        badge: undefined, // Will be set dynamically
        description: "View all notifications"
      },
    ]
  },
  {
    title: "Resources",
    items: [
      {
        href: "/guide",
        label: "75 Hard Guide",
        icon: BookOpen,
        description: "Learn about the challenge"
      },
      {
        href: "/achievements",
        label: "Achievements",
        icon: Award,
        description: "View your milestones"
      },
      {
        href: "/help",
        label: "Help & Support",
        icon: HelpCircle,
        description: "Get assistance"
      },
    ]
  }
]

export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    let subscription: any = null

    const setupNotifications = async () => {
      // Load initial count
      await loadUnreadCount()

      // Subscribe to changes
      subscription = await inAppNotificationService.subscribeToChanges(() => {
        loadUnreadCount()
      })
    }

    setupNotifications()

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const loadUnreadCount = async () => {
    try {
      const count = await inAppNotificationService.getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  const handleLogout = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] sm:w-[385px] p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="text-left">Menu</SheetTitle>
          <SheetDescription className="text-left">
            Navigate and manage your account
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Theme Toggle */}
          <div className="mb-6">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                {theme === "dark" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
                <span className="text-sm font-medium">Theme</span>
              </div>
              <div className="flex gap-1 bg-muted rounded-md p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0",
                    theme === "light" && "bg-background shadow-sm"
                  )}
                  onClick={() => setTheme("light")}
                  aria-label="Light theme"
                >
                  <Sun className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0",
                    theme === "dark" && "bg-background shadow-sm"
                  )}
                  onClick={() => setTheme("dark")}
                  aria-label="Dark theme"
                >
                  <Moon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Menu Sections */}
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title} className="mb-6">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <nav className="space-y-1">
                {section.items.map((item, index) => {
                  // Dynamically set badge for notifications
                  const badge = item.label === 'Notifications' && unreadCount > 0 
                    ? unreadCount.toString() 
                    : item.badge

                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: (sectionIndex * section.items.length + index) * 0.05 
                      }}
                    >
                      {item.href ? (
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg",
                            "transition-colors duration-200",
                            "hover:bg-muted/50",
                            "focus:outline-none focus:ring-2 focus:ring-primary",
                            pathname === item.href && "bg-muted"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {item.label}
                                </span>
                                {badge && (
                                  <span className="px-1.5 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                                    {badge}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-muted-foreground">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      ) : (
                      <button
                        onClick={() => {
                          if (item.action) {
                            item.action()
                          }
                          setOpen(false)
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-lg",
                          "transition-colors duration-200",
                          "hover:bg-muted/50",
                          "focus:outline-none focus:ring-2 focus:ring-primary"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {item.label}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                  </motion.div>
                  )
                })}
              </nav>
            </div>
          ))}

          <Separator className="my-6" />

          {/* PWA Install */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-lg",
              "transition-colors duration-200",
              "hover:bg-muted/50",
              "focus:outline-none focus:ring-2 focus:ring-primary",
              "mb-2"
            )}
          >
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <div className="text-sm font-medium">Install App</div>
                <p className="text-xs text-muted-foreground">
                  Add to home screen
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </motion.button>

          {/* Logout */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-lg",
              "transition-colors duration-200",
              "hover:bg-red-500/10 text-red-600",
              "focus:outline-none focus:ring-2 focus:ring-red-500"
            )}
          >
            <div className="flex items-center gap-3">
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">Log Out</span>
            </div>
          </motion.button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Hamburger button with animation
export function HamburgerButton({ 
  isOpen, 
  onClick 
}: { 
  isOpen: boolean
  onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative h-10 w-10 rounded-lg",
        "hover:bg-muted transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-primary"
      )}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-5 h-5 relative">
          <motion.span
            className="absolute h-0.5 w-5 bg-current transform"
            animate={{
              rotate: isOpen ? 45 : 0,
              y: isOpen ? 0 : -6,
            }}
            transition={{ duration: 0.2 }}
          />
          <motion.span
            className="absolute h-0.5 w-5 bg-current"
            animate={{
              opacity: isOpen ? 0 : 1,
            }}
            transition={{ duration: 0.2 }}
          />
          <motion.span
            className="absolute h-0.5 w-5 bg-current transform"
            animate={{
              rotate: isOpen ? -45 : 0,
              y: isOpen ? 0 : 6,
            }}
            transition={{ duration: 0.2 }}
          />
        </div>
      </div>
    </button>
  )
}